import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async getProfile(userId: string) {
    // Include role + department so the frontend (and app bootstrap) always
    // knows which dashboard to show. Without this, a manager would be treated
    // as a plain citizen after an app restart.
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: true,
        department: true,
      },
    });

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

  /**
   * Uploads a new profile image to Cloudinary, saves its url + public_id,
   * and removes the previous image (best-effort) so old files don't pile up.
   */
  async uploadProfileImage(userId: string, fileBuffer: Buffer) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImagePublicId: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    // 1. Upload the new image to Cloudinary.
    const uploadResult = await this.cloudinary.uploadImage(fileBuffer);

    // 2. Persist the new secure_url + public_id.
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: uploadResult.secure_url,
        profileImagePublicId: uploadResult.public_id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        profileImage: true,
      },
    });

    // 3. Best-effort cleanup of the previous image. A failure here must not
    //    fail the request, because the new image is already saved.
    if (existing.profileImagePublicId) {
      try {
        await this.cloudinary.deleteImage(existing.profileImagePublicId);
      } catch {
        // non-critical: leave the old asset if Cloudinary cleanup fails
      }
    }

    return {
      message: 'Profile image updated successfully',
      user: updatedUser,
    };
  }

  /**
   * Removes the user's profile image from Cloudinary and clears the DB fields.
   */
  async deleteProfileImage(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profileImage: true,
        profileImagePublicId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profileImage && !user.profileImagePublicId) {
      throw new BadRequestException('No profile image to delete');
    }

    // Remove from Cloudinary first; if this fails it surfaces as a 500 so the
    // client knows the image was not actually deleted.
    if (user.profileImagePublicId) {
      await this.cloudinary.deleteImage(user.profileImagePublicId);
    }

    // Clear the references from the database.
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: null,
        profileImagePublicId: null,
      },
    });

    return {
      message: 'Profile image deleted successfully',
    };
  }
}
