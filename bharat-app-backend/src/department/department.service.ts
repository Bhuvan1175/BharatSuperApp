import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a department (owns one app module via moduleKey). */
  async create(dto: CreateDepartmentDto) {
    try {
      return await this.prisma.department.create({
        data: {
          name: dto.name,
          label: dto.label,
          moduleKey: dto.moduleKey,
        },
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

  /** List all departments. */
  findAll() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }
}
