import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        address: true,
        avatar_url: true,
        status: true,
        created_at: true,
        user_roles: {
          include: {
            role: true,
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone_number: dto.phone_number,
        address: dto.address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        address: true,
        avatar_url: true,
        status: true,
        created_at: true,
        user_roles: {
          include: {
            role: true,
          }
        }
      }
    });

    return updatedUser;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported file format. Please upload JPG, PNG, or WEBP.');
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File is too large. Maximum size is 5MB.');
    }

    try {
      const avatarUrl = await this.storageService.uploadFile(file, 'avatars', userId);

      // Persist to user
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatar_url: avatarUrl },
      });

      return { avatar_url: avatarUrl };
    } catch (error) {
      console.error('Failed to upload avatar via StorageService', error);
      throw new InternalServerErrorException('Failed to upload avatar');
    }
  }
}
