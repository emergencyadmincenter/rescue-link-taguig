import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../generated/prisma/enums';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    const signInDto = { email: 'test@example.com', password: 'password123' };

    it('should return a token and user data for valid credentials', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        status: UserStatus.active,
        avatar_url: null,
        password_hash: 'hashed_password',
        user_roles: [{ role: { name: 'admin' } }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('mock_token');

      const result = await service.signIn(signInDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signInDto.email },
        include: { user_roles: { include: { role: true } } },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(signInDto.password, mockUser.password_hash);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        roles: ['admin'],
      });
      expect(result).toEqual({
        token: 'mock_token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          status: mockUser.status,
          avatar_url: mockUser.avatar_url,
          roles: ['admin'],
        },
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        status: UserStatus.inactive,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return user data if user is found', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        status: UserStatus.active,
        avatar_url: null,
        user_roles: [{ role: { name: 'admin' } }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getMe('1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { user_roles: { include: { role: true } } },
      });
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        status: mockUser.status,
        avatar_url: mockUser.avatar_url,
        roles: ['admin'],
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getMe('1')).rejects.toThrow(UnauthorizedException);
    });
  });
});
