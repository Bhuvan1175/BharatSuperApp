import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a department (owns one app module via moduleKey) and ensure it has a
   * default manager role:
   *   - if `roleId` is provided, link that existing role;
   *   - otherwise auto-create "<NAME>_MANAGER" with view+manage permissions
   *     for this module and link it.
   */
  async create(dto: CreateDepartmentDto) {
    // Resolve/create the default role BEFORE the department so we can link it.
    let defaultRoleId: string;

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role) {
        throw new NotFoundException('Provided roleId does not exist');
      }
      defaultRoleId = role.id;
    } else {
      const roleName = `${dto.name}_MANAGER`;
      const permissions = [`${dto.moduleKey}:view`, `${dto.moduleKey}:manage`];
      const role = await this.prisma.role.upsert({
        where: { name: roleName },
        update: { permissions },
        create: {
          name: roleName,
          label: `${dto.label ?? dto.name} Manager`,
          permissions,
          isSystem: false,
        },
      });
      defaultRoleId = role.id;
    }

    try {
      return await this.prisma.department.create({
        data: {
          name: dto.name,
          label: dto.label,
          moduleKey: dto.moduleKey,
          defaultRoleId,
        },
        include: { defaultRole: true },
      });
    } catch (error) {
      // P2002 = the unique `name` or `moduleKey` is already taken.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] ?? 'value';
        throw new ConflictException(`This ${field} is already taken`);
      }
      throw error;
    }
  }

  /** List all departments with their default (manager) role. */
  findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { defaultRole: true },
    });
  }

  /**
   * Edit a department. Only the display `label` can change — `name` and
   * `moduleKey` are immutable (they wire roles/permissions/module routing).
   */
  async update(id: string, dto: UpdateDepartmentDto) {
    try {
      return await this.prisma.department.update({
        where: { id },
        data: {
          ...(dto.label !== undefined ? { label: dto.label } : {}),
        },
        include: { defaultRole: true },
      });
    } catch (error) {
      // P2025 = record to update not found.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Department not found');
      }
      throw error;
    }
  }

  /**
   * Delete a department.
   *
   * Any users still assigned are first DETACHED (department + role cleared) so
   * they revert to plain citizens rather than being deleted or left pointing at
   * a dead department. The whole thing runs in a transaction so we never end up
   * half-deleted.
   *
   * As a best-effort cleanup, the department's auto-created manager role is
   * removed too — but ONLY if it is non-system and no longer referenced by any
   * user or other department (so shared/system roles are never touched).
   */
  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Detach every user in this department → back to a plain citizen.
      await tx.user.updateMany({
        where: { departmentId: id },
        data: { departmentId: null, roleId: null },
      });

      // 2. Delete the department itself.
      await tx.department.delete({ where: { id } });

      // 3. Best-effort: drop the now-orphaned manager role if it's safe to.
      if (dept.defaultRoleId) {
        const role = await tx.role.findUnique({
          where: { id: dept.defaultRoleId },
          include: {
            _count: {
              select: { users: true, defaultForDepartments: true },
            },
          },
        });
        if (
          role &&
          !role.isSystem &&
          role._count.users === 0 &&
          role._count.defaultForDepartments === 0
        ) {
          await tx.role.delete({ where: { id: role.id } });
        }
      }
    });

    return {
      success: true,
      message: `Department "${dept.name}" deleted`,
    };
  }
}
