import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    console.log('Service UserId:', userId);

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    console.log('DB User:', user);

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      return await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: updateProfileDto,
      });
    } catch (error) {
      // Prisma throws P2002 when a @unique constraint (username / email) is violated.
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

  async getCompleteProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        username: true,
        bio: true,
        profileImage: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fields that count toward profile completion.
    const fields: (keyof typeof user)[] = [
      'name',
      'email',
      'username',
      'bio',
      'profileImage',
    ];

    const missingFields = fields.filter((field) => {
      const value = user[field];
      return value === null || value === undefined || value.trim() === '';
    });

    const completedCount = fields.length - missingFields.length;
    const completionPercentage = Math.round(
      (completedCount / fields.length) * 100,
    );

    return {
      profileCompleted: missingFields.length === 0,
      completionPercentage,
      missingFields,
    };
  }

  async searchUsers(userId: string, query: string) {
    return this.prisma.user.findMany({
      where: {
        // Never return the logged-in user in their own search results.
        id: {
          not: userId,
        },
        // Match on either username OR name, case-insensitively.
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        profileImage: true,
      },
      take: 20,
    });
  }
}