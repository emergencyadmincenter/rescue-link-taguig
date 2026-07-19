import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { UserStatus } from '../../generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(data: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    if (user.status !== UserStatus.active) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_ACTIVE',
          message: `Account is ${user.status}`,
        },
      });
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        roles,
      },
    };
  }
}
