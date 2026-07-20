import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async create(data: CreatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Permission name already exists',
        },
      });
    }

    return this.prisma.permission.create({ data });
  }

  async update(id: string, data: UpdatePermissionDto) {
    if (data.name) {
      const existing = await this.prisma.permission.findUnique({
        where: { name: data.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Permission name already exists',
          },
        });
      }
    }

    try {
      return await this.prisma.permission.update({
        where: { id },
        data,
      });
    } catch (e) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Permission not found' },
      });
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.permission.delete({
        where: { id },
      });
      return { success: true };
    } catch (e) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Permission not found' },
      });
    }
  }
}
