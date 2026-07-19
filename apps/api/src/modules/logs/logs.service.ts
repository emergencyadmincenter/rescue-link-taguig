import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { CreateEmergencyDto } from './dto/create-emergency.dto';
import { Prisma, LogStatus, LogSource } from '../../generated/prisma/client';
import { randomInt } from 'crypto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateReferenceNo(): Promise<string> {
    const maxRetries = 50;
    for (let i = 0; i < maxRetries; i++) {
      const num = randomInt(10000, 99999);
      const referenceNo = `REQ-${num}`;
      const log = await this.prisma.log.findUnique({
        where: { reference_no: referenceNo },
      });
      if (!log) {
        return referenceNo;
      }
    }
    throw new Error(
      'Failed to generate unique reference number after maximum retries',
    );
  }

  async findAll(query: QueryLogsDto) {
    const {
      search,
      status,
      source,
      assigned_coordinator_id,
      date_from,
      date_to,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    const where: Prisma.LogWhereInput = {};

    if (search) {
      where.OR = [
        { caller_name: { contains: search, mode: 'insensitive' } },
        { caller_contact: { contains: search, mode: 'insensitive' } },
        { reference_no: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          assigned_coordinator: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (status) where.status = status;
    if (source) where.source = source;
    if (assigned_coordinator_id)
      where.assigned_coordinator_id = assigned_coordinator_id;

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) where.created_at.lte = new Date(date_to);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort_by]: sort_order },
        include: {
          assigned_coordinator: {
            select: { id: true, name: true, email: true },
          },
          created_by_coordinator: {
            select: { id: true, name: true, email: true },
          },
          calls: {
            orderBy: { started_at: 'desc' },
            take: 1,
          },
          _count: { select: { messages: true } },
          resource_assignments: {
            include: { resource: true },
          },
        },
      }),
      this.prisma.log.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.log.findUnique({
      where: { id },
      include: {
        assigned_coordinator: { select: { id: true, name: true, email: true } },
        created_by_coordinator: {
          select: { id: true, name: true, email: true },
        },
        calls: {
          orderBy: { started_at: 'desc' },
        },
        messages: {
          orderBy: { created_at: 'asc' },
        },
        resource_assignments: {
          include: { resource: true },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }

    return log;
  }

  async create(dto: CreateLogDto, userId: string) {
    const reference_no = await this.generateReferenceNo();

    const { resource_ids, channels, ...rest } = dto;

    const validResourceIds: string[] = [];
    const customResourceNames: string[] = [];
    if (resource_ids) {
      for (const id of resource_ids) {
        if (id.startsWith('custom_')) {
          customResourceNames.push(id.replace('custom_', ''));
        } else {
          validResourceIds.push(id);
        }
      }
    }

    const customResourceIds: string[] = [];
    for (const name of customResourceNames) {
      let res = await this.prisma.resource.findUnique({ where: { name } });
      if (!res) {
        res = await this.prisma.resource.create({
          data: { name, category: 'utility' },
        });
      }
      customResourceIds.push(res.id);
    }
    const finalResourceIds = [...validResourceIds, ...customResourceIds];

    return this.prisma.log.create({
      data: {
        ...rest,
        reference_no,
        source: LogSource.manual,
        status: LogStatus.active,
        created_by_coordinator_id: userId,
        assigned_coordinator_id: userId,
        last_activity_at: new Date(),
        channels: channels || [],
        resource_assignments: finalResourceIds.length
          ? {
              create: finalResourceIds.map((id) => ({
                resource: { connect: { id } },
              })),
            }
          : undefined,
      },
      include: {
        assigned_coordinator: { select: { id: true, name: true, email: true } },
        created_by_coordinator: {
          select: { id: true, name: true, email: true },
        },
        resource_assignments: { include: { resource: true } },
      },
    });
  }

  async update(id: string, dto: UpdateLogDto, userId: string) {
    const existing = await this.prisma.log.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }

    if (
      existing.assigned_coordinator_id !== userId &&
      existing.created_by_coordinator_id !== userId
    ) {
      throw new UnauthorizedException(
        'You do not have permission to edit this log',
      );
    }

    const { resource_ids, channels, ...rest } = dto;

    const updateData: Prisma.LogUpdateInput = {
      ...rest,
      last_activity_at: new Date(),
    };

    if (channels !== undefined) {
      updateData.channels = channels;
    }

    if (
      (dto.status === LogStatus.resolved ||
        dto.status === LogStatus.cancelled) &&
      existing.status !== dto.status
    ) {
      if (dto.status === LogStatus.resolved)
        updateData.resolved_at = new Date();

      // Update associated call if it's still active
      await this.prisma.call.updateMany({
        where: { log_id: id, status: { in: ['active', 'ringing'] } },
        data: { status: 'ended', ended_at: new Date() },
      });
    } else if (dto.status && dto.status !== LogStatus.resolved) {
      updateData.resolved_at = null;
    }

    // Process resource updates
    if (resource_ids !== undefined) {
      const validResourceIds: string[] = [];
      const customResourceNames: string[] = [];
      for (const id of resource_ids) {
        if (id.startsWith('custom_')) {
          customResourceNames.push(id.replace('custom_', ''));
        } else {
          validResourceIds.push(id);
        }
      }

      const customResourceIds: string[] = [];
      for (const name of customResourceNames) {
        let res = await this.prisma.resource.findUnique({ where: { name } });
        if (!res) {
          res = await this.prisma.resource.create({
            data: { name, category: 'utility' },
          });
        }
        customResourceIds.push(res.id);
      }
      const finalResourceIds = [...validResourceIds, ...customResourceIds];

      return this.prisma.$transaction(async (tx) => {
        // Delete existing assignments
        await tx.logResourceAssignment.deleteMany({
          where: { log_id: id },
        });

        // Create new assignments if any
        if (finalResourceIds.length > 0) {
          await tx.logResourceAssignment.createMany({
            data: finalResourceIds.map((resourceId) => ({
              log_id: id,
              resource_id: resourceId,
            })),
          });
        }

        // Update main log
        return tx.log.update({
          where: { id },
          data: updateData,
          include: {
            assigned_coordinator: {
              select: { id: true, name: true, email: true },
            },
            created_by_coordinator: {
              select: { id: true, name: true, email: true },
            },
            resource_assignments: { include: { resource: true } },
          },
        });
      });
    }

    return this.prisma.log.update({
      where: { id },
      data: updateData,
      include: {
        assigned_coordinator: { select: { id: true, name: true, email: true } },
        created_by_coordinator: {
          select: { id: true, name: true, email: true },
        },
        resource_assignments: { include: { resource: true } },
      },
    });
  }

  async getStatusCounts(userId: string) {
    const counts = await this.prisma.log.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const myLogsCount = await this.prisma.log.count({
      where: { assigned_coordinator_id: userId },
    });

    const result = {
      total: 0,
      active: 0,
      dispatched: 0,
      resolved: 0,
      cancelled: 0,
      my_logs: myLogsCount,
    };

    counts.forEach((item) => {
      result[item.status] = item._count.status;
      result.total += item._count.status;
    });

    return result;
  }

  async getResources() {
    return this.prisma.resource.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
