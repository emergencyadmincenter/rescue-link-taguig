import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { ActivatePersonnelDto } from './dto/activate-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';
import { MailService } from '../mail/mail.service';

export interface PersonnelItem {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface PersonnelGroup {
  role: string;
  count: number;
  personnel: PersonnelItem[];
}

@Injectable()
export class PersonnelService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(dto: CreatePersonnelDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.role_id },
    });
    if (!role) {
      throw new NotFoundException('Selected role does not exist');
    }

    if (role.name !== 'coordinator') {
      throw new BadRequestException(
        'Role selection is limited to the Coordinator role',
      );
    }

    const activationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          status: 'pending_activation',
        },
      });

      await tx.userRole.create({
        data: {
          user_id: user.id,
          role_id: dto.role_id,
        },
      });

      const token = await tx.userToken.create({
        data: {
          user_id: user.id,
          type: 'activation',
          token: activationToken,
          status: 'active',
          expires_at: expiresAt,
        },
      });

      return { user, token };
    });

    await this.mailService.sendActivationEmail(
      result.user.email,
      result.user.name,
      result.token.token,
    );

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      status: result.user.status,
      role_id: dto.role_id,
    };
  }

  async activateAccount(dto: ActivatePersonnelDto) {
    const userToken = await this.prisma.userToken.findFirst({
      where: {
        token: dto.token,
        type: 'activation',
        status: 'active',
      },
    });

    if (!userToken || userToken.expires_at < new Date()) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userToken.user_id },
        data: {
          password_hash: passwordHash,
          status: 'active',
        },
      });

      await tx.userToken.update({
        where: { id: userToken.id },
        data: {
          status: 'used',
        },
      });
    });

    return { message: 'Account activated successfully' };
  }

  async getPersonnel(
    search?: string,
    status?: string,
  ): Promise<{ groups: PersonnelGroup[] }> {
    const whereClause: any = {
      status: { not: 'removed' },
    };

    if (status) {
      whereClause.status = status as any;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    const groups: Record<string, PersonnelGroup> = {};
    for (const role of roles) {
      groups[role.name] = {
        role: role.name,
        count: 0,
        personnel: [],
      };
    }

    for (const user of users) {
      if (user.user_roles.length > 0) {
        const roleName = user.user_roles[0].role.name;
        if (groups[roleName]) {
          groups[roleName].personnel.push({
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status,
            createdAt: user.created_at.toISOString(),
          });
          groups[roleName].count++;
        }
      }
    }

    return { groups: Object.values(groups) };
  }

  async resendActivation(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'pending_activation') {
      throw new BadRequestException('Account is not pending activation');
    }

    const activationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.prisma.$transaction(async (tx) => {
      // Invalidate existing active tokens
      await tx.userToken.updateMany({
        where: {
          user_id: user.id,
          type: 'activation',
          status: 'active',
        },
        data: {
          status: 'revoked',
        },
      });

      // Create new token
      await tx.userToken.create({
        data: {
          user_id: user.id,
          type: 'activation',
          token: activationToken,
          status: 'active',
          expires_at: expiresAt,
        },
      });
    });

    await this.mailService.sendActivationEmail(
      user.email,
      user.name,
      activationToken,
    );

    return { message: 'Activation email resent successfully' };
  }

  async updatePersonnel(id: string, dto: UpdatePersonnelDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      const activationToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: {
            name: dto.name || user.name,
            email: dto.email,
            status: 'pending_activation',
            password_hash: null, // Reset password since it's a new email
          },
        });

        // Invalidate old tokens
        await tx.userToken.updateMany({
          where: {
            user_id: user.id,
            type: 'activation',
            status: 'active',
          },
          data: {
            status: 'revoked',
          },
        });

        // Create new token
        await tx.userToken.create({
          data: {
            user_id: user.id,
            type: 'activation',
            token: activationToken,
            status: 'active',
            expires_at: expiresAt,
          },
        });
      });

      await this.mailService.sendActivationEmail(
        dto.email,
        dto.name || user.name,
        activationToken,
      );

      return { message: 'Personnel updated. New activation email sent.' };
    }

    // Just update name
    if (dto.name && dto.name !== user.name) {
      await this.prisma.user.update({
        where: { id },
        data: { name: dto.name },
      });
    }

    return { message: 'Personnel updated successfully' };
  }

  async deactivatePersonnel(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status === 'removed')
      throw new BadRequestException('User is removed');

    await this.prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { message: 'Personnel deactivated successfully' };
  }

  async reactivatePersonnel(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status === 'removed')
      throw new BadRequestException('User is removed');

    await this.prisma.user.update({
      where: { id },
      data: { status: 'active' },
    });

    return { message: 'Personnel reactivated successfully' };
  }

  async removePersonnel(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          status: 'removed',
          removed_at: new Date(),
          email: `removed-${Date.now()}-${user.email}`, // Free up email
        },
      });

      // Revoke any active tokens
      await tx.userToken.updateMany({
        where: { user_id: id, status: 'active' },
        data: { status: 'revoked' },
      });
    });

    return { message: 'Personnel removed successfully' };
  }
}
