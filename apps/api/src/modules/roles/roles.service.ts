import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        role_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found' },
      });
    }

    return role.role_permissions.map((rp) => rp.permission);
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    // Verify role exists
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found' },
      });
    }

    // Atomic transaction: delete existing and insert new
    await this.prisma.$transaction(async (prisma) => {
      await prisma.rolePermission.deleteMany({
        where: { role_id: roleId },
      });

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return this.getRolePermissions(roleId);
  }
}
