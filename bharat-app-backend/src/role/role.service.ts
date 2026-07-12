import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a custom (non-system) role. */
  async create(dto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: {
          name: dto.name,
          label: dto.label,
          permissions: dto.permissions ?? [],
          isSystem: false,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Role "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  /** List all roles (system + custom). */
  findAll() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }
}
