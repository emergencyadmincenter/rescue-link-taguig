import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';

@Injectable()
export class PersonnelService {
  constructor(private prisma: PrismaService) {}

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

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      status: result.user.status,
      role_id: dto.role_id,
      activation_token: result.token.token,
    };
  }
}