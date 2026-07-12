import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentUserDto } from './dto/create-department-user.dto';

/** Fields returned by admin ops — never leaks refreshToken. */
const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  isActive: true,
  role: { select: { name: true, label: true, permissions: true } },
  department: { select: { name: true, label: true, moduleKey: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Assign an existing role (by name) to a user. */
  async assignRole(userId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }
    return this.updateUser(userId, { roleId: role.id });
  }

  /** Assign an existing department (by name) to a user. */
  async assignDepartment(userId: string, departmentName: string) {
    const dept = await this.prisma.department.findUnique({
      where: { name: departmentName },
    });
    if (!dept) {
      throw new NotFoundException(`Department "${departmentName}" not found`);
    }
    return this.updateUser(userId, { departmentId: dept.id });
  }

  /**
   * Provision a department officer. Promotes an existing citizen or creates a
   * fresh account — either way they log in with the SAME Email OTP flow; there
   * is no separate credential. Role + department are the only difference.
   */
  async createDepartmentUser(dto: CreateDepartmentUserDto) {
    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });
    if (!role) {
      throw new NotFoundException(`Role "${dto.role}" not found`);
    }

    const dept = await this.prisma.department.findUnique({
      where: { name: dto.department },
    });
    if (!dept) {
      throw new NotFoundException(`Department "${dto.department}" not found`);
    }

    return this.prisma.user.upsert({
      where: { email: dto.email },
      update: { roleId: role.id, departmentId: dept.id, isActive: true },
      create: {
        email: dto.email,
        isVerified: false,
        isActive: true,
        roleId: role.id,
        departmentId: dept.id,
      },
      select: safeUserSelect,
    });
  }

  /** Deactivate a user — blocks login and all requests immediately. */
  deactivateUser(userId: string) {
    return this.updateUser(userId, { isActive: false });
  }

  /** Re-activate a previously deactivated user. */
  activateUser(userId: string) {
    return this.updateUser(userId, { isActive: true });
  }

  private async updateUser(
    userId: string,
    data: Prisma.UserUncheckedUpdateInput,
  ) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: safeUserSelect,
      });
    } catch (error) {
      // P2025 = record to update not found.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
