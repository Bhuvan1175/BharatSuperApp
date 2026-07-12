import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

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
}
