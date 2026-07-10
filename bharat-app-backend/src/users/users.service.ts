import { Injectable } from '@nestjs/common';
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

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updateProfileDto,
    });
  }
}