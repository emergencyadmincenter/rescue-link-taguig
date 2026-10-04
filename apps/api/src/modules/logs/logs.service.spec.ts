import { Test, TestingModule } from '@nestjs/testing';
import { LogsService } from './logs.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CommunicationsService } from '../communications/communications.service';
import { LogsGateway } from './logs.gateway';
import { NotFoundException } from '@nestjs/common';
import { LogStatus, LogSource } from '../../generated/prisma/client';

jest.mock('crypto', () => ({
  randomInt: jest.fn().mockReturnValue(12345),
  randomUUID: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('LogsService', () => {
  let service: LogsService;
  let prisma: PrismaService;
  let communicationsService: CommunicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        {
          provide: PrismaService,
          useValue: {
            log: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              groupBy: jest.fn(),
            },
            shadowBan: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            resource: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
            },
            logStatusHistory: {
              create: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
              return cb(prisma);
            }),
            call: {
              updateMany: jest.fn(),
            },
            logResourceAssignment: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
          },
        },
        {
          provide: CommunicationsService,
          useValue: {
            broadcastNewIncident: jest.fn(),
          },
        },
        {
          provide: LogsGateway,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<LogsService>(LogsService);
    prisma = module.get<PrismaService>(PrismaService);
    communicationsService = module.get<CommunicationsService>(CommunicationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated logs', async () => {
      (prisma.log.findMany as jest.Mock).mockResolvedValue([{ id: '1', status: 'active', fraud_assessments: [] }]);
      (prisma.log.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      
      expect(prisma.log.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        data: [{ id: '1', status: 'active', fraud_assessments: [], is_shadow_banned: false }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });
  });

  describe('findOne', () => {
    it('should return a log by id', async () => {
      const mockLog = { id: '1', fraud_assessments: [] };
      (prisma.log.findUnique as jest.Mock).mockResolvedValue(mockLog);

      const result = await service.findOne('1');

      expect(prisma.log.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
      expect(result).toMatchObject({ id: '1', is_shadow_banned: false });
    });

    it('should throw NotFoundException if not found', async () => {
      (prisma.log.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a log and broadcast', async () => {
      const createDto = { caller_name: 'John', status: LogStatus.active };
      const createdLog = { id: '1', ...createDto };

      (prisma.log.findUnique as jest.Mock).mockResolvedValueOnce(null); // generateReferenceNo
      (prisma.log.create as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.create(createDto as any, 'user1');

      expect(prisma.log.create).toHaveBeenCalled();
      expect(communicationsService.broadcastNewIncident).toHaveBeenCalledWith('1');
      expect(result).toEqual(createdLog);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if log does not exist', async () => {
      (prisma.log.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('1', {}, 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should update log if permitted', async () => {
      const existing = { id: '1', assigned_coordinator_id: 'user1', status: LogStatus.active };
      (prisma.log.findUnique as jest.Mock).mockResolvedValue(existing);
      
      const updatedLog = { ...existing, status: LogStatus.resolved };
      (prisma.log.update as jest.Mock).mockResolvedValue(updatedLog);

      const result = await service.update('1', { status: LogStatus.resolved }, 'user1');

      expect(prisma.log.update).toHaveBeenCalled();
      expect(result).toEqual(updatedLog);
    });
  });
});
