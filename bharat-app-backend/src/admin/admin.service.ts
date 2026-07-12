import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentUserDto } from './dto/create-department-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users.dto';

/** Fields returned by admin ops — never leaks refreshToken. */
const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  phoneNumber: true,
  isActive: true,
  createdAt: true,
  role: { select: { name: true, label: true, permissions: true } },
  department: { select: { name: true, label: true, moduleKey: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** List users with optional department / role / search filters. */
  listUsers(query: ListUsersQueryDto) {
    const where: Prisma.UserWhereInput = {};
    if (query.department) {
      where.department = { name: query.department };
    }
    if (query.role) {
      where.role = { name: query.role };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Dashboard counts. `managers` = users assigned to any department. */
  async stats() {
    const [users, managers, departments, roles] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { departmentId: { not: null } } }),
      this.prisma.department.count(),
      this.prisma.role.count(),
    ]);
    return { users, managers, departments, roles };
  }

  /**
   * Provision a department officer. Promotes an existing citizen or creates a
   * fresh account — either way they log in with the SAME Email OTP flow. If no
   * role is given, the department's default role is used.
   */
  async createDepartmentUser(dto: CreateDepartmentUserDto) {
    const dept = await this.prisma.department.findUnique({
      where: { name: dto.department },
    });
    if (!dept) {
      throw new NotFoundException(`Department "${dto.department}" not found`);
    }

    let roleId: string;
    if (dto.role) {
      const role = await this.prisma.role.findUnique({
        where: { name: dto.role },
      });
      if (!role) {
        throw new NotFoundException(`Role "${dto.role}" not found`);
      }
      roleId = role.id;
    } else if (dept.defaultRoleId) {
      roleId = dept.defaultRoleId;
    } else {
      throw new BadRequestException(
        'This department has no default role — provide a role explicitly',
      );
    }

    return this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        roleId,
        departmentId: dept.id,
        isActive: true,
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phoneNumber !== undefined
          ? { phoneNumber: dto.phoneNumber }
          : {}),
      },
      create: {
        email: dto.email,
        isVerified: false,
        isActive: true,
        roleId,
        departmentId: dept.id,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
      },
      select: safeUserSelect,
    });
  }

  /**
   * Edit a user. Department change → role follows the department (unless an
   * explicit role override is sent). Guards against the acting admin locking
   * themselves out (self-deactivate / self-demote).
   */
  async updateUser(
    actingUserId: string,
    targetId: string,
    dto: UpdateUserDto,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const isSelf = targetId === actingUserId;
    if (isSelf) {
      if (dto.isActive === false) {
        throw new ForbiddenException('You cannot deactivate your own account');
      }
      if (dto.department || (dto.role && dto.role !== 'SUPER_ADMIN')) {
        throw new ForbiddenException(
          'You cannot change your own role or department',
        );
      }
    }

    const data: Prisma.UserUncheckedUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    // Department change → default role of that department.
    let resolvedRoleId: string | undefined;
    if (dto.department) {
      const dept = await this.prisma.department.findUnique({
        where: { name: dto.department },
      });
      if (!dept) {
        throw new NotFoundException(`Department "${dto.department}" not found`);
      }
      data.departmentId = dept.id;
      if (dept.defaultRoleId) resolvedRoleId = dept.defaultRoleId;
    }

    // Explicit role override wins.
    if (dto.role) {
      const role = await this.prisma.role.findUnique({
        where: { name: dto.role },
      });
      if (!role) {
        throw new NotFoundException(`Role "${dto.role}" not found`);
      }
      resolvedRoleId = role.id;
    }

    if (resolvedRoleId) data.roleId = resolvedRoleId;

    try {
      return await this.prisma.user.update({
        where: { id: targetId },
        data,
        select: safeUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const field = (error.meta?.target as string[] | undefined)?.[0] ?? 'value';
        throw new ForbiddenException(`This ${field} is already taken`);
      }
      throw error;
    }
  }

  /** Deactivate a user (blocks login + all requests immediately). */
  deactivateUser(actingUserId: string, userId: string) {
    if (userId === actingUserId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    return this.updateUser(actingUserId, userId, { isActive: false });
  }

  /** Re-activate a previously deactivated user. */
  activateUser(actingUserId: string, userId: string) {
    return this.updateUser(actingUserId, userId, { isActive: true });
  }
}
