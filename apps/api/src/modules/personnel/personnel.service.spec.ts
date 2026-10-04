import { Test, TestingModule } from '@nestjs/testing';
import { PersonnelService } from './personnel.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'mock_token' }),
}));

describe('PersonnelService', () => {
  let service: PersonnelService;
  let prisma: PrismaService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonnelService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            userRole: {
              create: jest.fn(),
            },
            userToken: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
              return cb(prisma);
            }),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendActivationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PersonnelService>(PersonnelService);
    prisma = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = { name: 'Test User', email: 'test@example.com', role_id: 'role123' };

    it('should throw ConflictException if email exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if role is not coordinator', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({ name: 'admin' });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should create user and send activation email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({ name: 'coordinator' });
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'user1', name: 'Test User', email: 'test@example.com', status: 'pending_activation' });
      (prisma.userRole.create as jest.Mock).mockResolvedValue({});
      (prisma.userToken.create as jest.Mock).mockResolvedValue({ token: 'mock_token' });

      const result = await service.create(createDto);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(mailService.sendActivationEmail).toHaveBeenCalledWith('test@example.com', 'Test User', 'mock_token');
      expect(result).toHaveProperty('id', 'user1');
    });
  });

  describe('activateAccount', () => {
    it('should throw BadRequestException for invalid token', async () => {
      (prisma.userToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.activateAccount({ token: 'invalid', password: 'newpass' })).rejects.toThrow(BadRequestException);
    });

    it('should activate account and hash password', async () => {
      const mockToken = { id: 'token1', user_id: 'user1', expires_at: new Date(Date.now() + 10000) };
      (prisma.userToken.findFirst as jest.Mock).mockResolvedValue(mockToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pass');

      const result = await service.activateAccount({ token: 'valid', password: 'newpass' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { password_hash: 'hashed_pass', status: 'active' },
      });
      expect(result).toEqual({ message: 'Account activated successfully' });
    });
  });

  describe('deactivatePersonnel', () => {
    it('should throw NotFoundException if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deactivatePersonnel('1')).rejects.toThrow(NotFoundException);
    });

    it('should deactivate user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', status: 'active' });

      await service.deactivatePersonnel('1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'inactive' },
      });
    });
  });

  describe('removePersonnel', () => {
    it('should remove user and revoke tokens', async () => {
      const user = { id: '1', email: 'test@example.com' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      await service.removePersonnel('1');

      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({ status: 'removed' }),
      }));
      expect(prisma.userToken.updateMany).toHaveBeenCalledWith({
        where: { user_id: '1', status: 'active' },
        data: { status: 'revoked' },
      });
    });
  });
});
