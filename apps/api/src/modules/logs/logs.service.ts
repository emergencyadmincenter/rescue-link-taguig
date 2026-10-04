import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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

import { CommunicationsService } from '../communications/communications.service';

function maskSecurityIdentifier(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

import { LogsGateway } from './logs.gateway';

@Injectable()
export class LogsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CommunicationsService))
    private readonly communicationsService: CommunicationsService,
    @Inject(forwardRef(() => LogsGateway))
    private readonly logsGateway: LogsGateway,
  ) {}

  private async recordStatusHistory(
    tx: Prisma.TransactionClient,
    logId: string,
    previousStatus: LogStatus | null,
    newStatus: LogStatus,
    changedById: string | null,
    remarks?: string,
  ) {
    return tx.logStatusHistory.create({
      data: {
        log_id: logId,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by_id: changedById,
        remarks: remarks?.trim() || undefined,
      },
    });
  }

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

  private async buildBaseWhereClause(query: QueryLogsDto) {
    const {
      search,
      source,
      assigned_coordinator_id,
      barangay,
      incident_category_id,
      date_from,
      date_to,
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

    if (source) where.source = source;
    if (assigned_coordinator_id)
      where.assigned_coordinator_id = assigned_coordinator_id;
    if (barangay) where.barangay = barangay;
    if (incident_category_id) where.incident_category_id = incident_category_id;

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from)
        where.created_at.gte = new Date(`${date_from}T00:00:00+08:00`);
      if (date_to)
        where.created_at.lte = new Date(`${date_to}T23:59:59.999+08:00`);
    }

    const activeBans = await this.prisma.shadowBan.findMany({
      where: {
        active: true,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
    });

    const bannedDeviceUuids = Array.from(
      new Set(activeBans.map((b) => b.device_uuid).filter(Boolean)),
    ) as string[];
    const bannedHashes = Array.from(
      new Set(activeBans.map((b) => b.fingerprint_hash).filter(Boolean)),
    ) as string[];
    const bannedIps = Array.from(
      new Set(activeBans.map((b) => b.client_ip).filter(Boolean)),
    ) as string[];

    if (query.is_shadow_banned === 'true') {
      where.fraud_assessments = {
        some: {
          OR: [
            { device_uuid: { in: bannedDeviceUuids } },
            { fingerprint_hash: { in: bannedHashes } },
            { client_ip: { in: bannedIps } },
          ],
        },
      };
    } else if (query.is_shadow_banned === 'false') {
      where.AND = [
        {
          fraud_assessments: {
            none: {
              OR: [
                { device_uuid: { in: bannedDeviceUuids } },
                { fingerprint_hash: { in: bannedHashes } },
                { client_ip: { in: bannedIps } },
              ],
            },
          },
        },
      ];
    }

    return { where, bannedDeviceUuids, bannedHashes, bannedIps };
  }

  async findAll(query: QueryLogsDto) {
    const {
      search,
      status,
      source,
      assigned_coordinator_id,
      barangay,
      incident_category_id,
      date_from,
      date_to,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    const { where, bannedDeviceUuids, bannedHashes, bannedIps } =
      await this.buildBaseWhereClause(query);

    if (status) where.status = status;

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
          fraud_assessments: true,
        },
      }),
      this.prisma.log.count({ where }),
    ]);

    const enrichedData = data.map((log) => {
      const isShadowBanned = log.fraud_assessments?.some(
        (fa) =>
          (fa.device_uuid && bannedDeviceUuids.includes(fa.device_uuid)) ||
          (fa.fingerprint_hash && bannedHashes.includes(fa.fingerprint_hash)) ||
          (fa.client_ip && bannedIps.includes(fa.client_ip)),
      );
      return { ...log, is_shadow_banned: !!isShadowBanned };
    });

    return {
      data: enrichedData,
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
        fraud_assessments: true,
        status_history: {
          orderBy: { changed_at: 'asc' },
          include: {
            changed_by: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }

    const activeBans = await this.prisma.shadowBan.findMany({
      where: {
        active: true,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
    });

    const bannedDeviceUuids = new Set(
      activeBans.map((b) => b.device_uuid).filter(Boolean),
    );
    const bannedHashes = new Set(
      activeBans.map((b) => b.fingerprint_hash).filter(Boolean),
    );
    const bannedIps = new Set(
      activeBans.map((b) => b.client_ip).filter(Boolean),
    );

    const isShadowBanned = log.fraud_assessments?.some(
      (fa) =>
        (fa.device_uuid && bannedDeviceUuids.has(fa.device_uuid)) ||
        (fa.fingerprint_hash && bannedHashes.has(fa.fingerprint_hash)) ||
        (fa.client_ip && bannedIps.has(fa.client_ip)),
    );

    let shadowBanDetails: any = null;
    if (isShadowBanned) {
      // Find the specific active ban that caused this to be true
      const matchingBan = activeBans.find((b) =>
        log.fraud_assessments?.some(
          (fa) =>
            (fa.device_uuid && fa.device_uuid === b.device_uuid) ||
            (fa.fingerprint_hash &&
              fa.fingerprint_hash === b.fingerprint_hash) ||
            (fa.client_ip && fa.client_ip === b.client_ip),
        ),
      );

      if (matchingBan) {
        const matchingAssessment = log.fraud_assessments?.find(
          (fa) =>
            (fa.device_uuid && fa.device_uuid === matchingBan.device_uuid) ||
            (fa.fingerprint_hash &&
              fa.fingerprint_hash === matchingBan.fingerprint_hash) ||
            (fa.client_ip && fa.client_ip === matchingBan.client_ip),
        );
        let coordinator: { id: string; name: string } | null = null;
        if (matchingBan.created_by_id) {
          coordinator = await this.prisma.user.findUnique({
            where: { id: matchingBan.created_by_id },
            select: { id: true, name: true },
          });
        }
        shadowBanDetails = {
          reason: matchingBan.reason,
          violation_category: matchingBan.violation_category,
          severity: matchingBan.severity,
          details: matchingBan.details,
          created_at: matchingBan.created_at,
          expires_at: matchingBan.expires_at,
          coordinator,
          security_context: matchingAssessment
            ? {
                client_ip: matchingAssessment.client_ip,
                device_uuid: maskSecurityIdentifier(
                  matchingAssessment.device_uuid,
                ),
                device_uuid_full: matchingAssessment.device_uuid,
                fingerprint_hash: maskSecurityIdentifier(
                  matchingAssessment.fingerprint_hash,
                ),
                fingerprint_hash_full: matchingAssessment.fingerprint_hash,
                risk_classification: matchingAssessment.risk_classification,
                is_vpn: matchingAssessment.is_vpn,
                is_proxy: matchingAssessment.is_proxy,
                is_hosting: matchingAssessment.is_hosting,
                distance_km: matchingAssessment.distance_km,
                location_permission_granted:
                  matchingAssessment.location_permission_granted,
                assessed_at: matchingAssessment.created_at,
              }
            : null,
        };
      }
    }

    return {
      ...log,
      is_shadow_banned: !!isShadowBanned,
      shadow_ban_details: shadowBanDetails,
    };
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

    const initialStatus = (rest.status as LogStatus) || LogStatus.active;
    const log = await this.prisma.$transaction(async (tx) => {
      const createdLog = await tx.log.create({
        data: {
          ...rest,
          reference_no,
          source: LogSource.manual,
          status: initialStatus,
          resolved_at:
            initialStatus === LogStatus.resolved ? new Date() : undefined,
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
          assigned_coordinator: {
            select: { id: true, name: true, email: true },
          },
          created_by_coordinator: {
            select: { id: true, name: true, email: true },
          },
          resource_assignments: { include: { resource: true } },
          fraud_assessments: true,
          status_history: {
            orderBy: { changed_at: 'asc' },
            include: {
              changed_by: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      await this.recordStatusHistory(
        tx,
        createdLog.id,
        null,
        initialStatus,
        userId,
        'Initial status recorded when the Log was created.',
      );

      return createdLog;
    });

    this.communicationsService.broadcastNewIncident(log.id);
    return log;
  }

  async update(id: string, dto: UpdateLogDto, userId: string) {
    const existing = await this.prisma.log.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { user_roles: { include: { role: true } } },
    });
    const isAdmin = userRecord?.user_roles?.some(
      (ur) => ur.role.name === 'admin',
    );

    if (
      !isAdmin &&
      existing.assigned_coordinator_id &&
      existing.assigned_coordinator_id !== userId &&
      existing.created_by_coordinator_id !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to edit this log',
      );
    }

    const { resource_ids, channels, status_remarks, ...rest } = dto;
    const statusChanged =
      dto.status !== undefined && existing.status !== dto.status;
    const statusRemarks =
      status_remarks?.trim() ||
      dto.cancellation_reason ||
      dto.description ||
      (statusChanged
        ? `Status changed from ${existing.status} to ${dto.status}.`
        : undefined);

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
        const updatedLog = await tx.log.update({
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
            fraud_assessments: true,
          },
        });

        if (statusChanged) {
          await this.recordStatusHistory(
            tx,
            id,
            existing.status,
            dto.status as LogStatus,
            userId,
            statusRemarks,
          );
        }

        return updatedLog;
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedLog = await tx.log.update({
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
          fraud_assessments: true,
          status_history: {
            orderBy: { changed_at: 'asc' },
            include: {
              changed_by: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (statusChanged) {
        await this.recordStatusHistory(
          tx,
          id,
          existing.status,
          dto.status as LogStatus,
          userId,
          statusRemarks,
        );
      }

      return updatedLog;
    });
  }

  async getStatusCounts(userId: string, query: QueryLogsDto) {
    const { where } = await this.buildBaseWhereClause(query);
    const counts = await this.prisma.log.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    });

    const myLogsCount = await this.prisma.log.count({
      where: { ...where, assigned_coordinator_id: userId },
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
      if (result[item.status] !== undefined) {
        result[item.status] = item._count.status;
      }
      result.total += item._count.status;
    });

    return result;
  }

  async getResources() {
    return this.prisma.resource.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async generateShareLink(id: string) {
    const log = await this.prisma.log.findUnique({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }

    if (
      log.public_token &&
      log.public_token_expires_at &&
      log.public_token_expires_at > new Date()
    ) {
      return { token: log.public_token };
    }

    const { randomUUID } = require('crypto');
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.log.update({
      where: { id },
      data: {
        public_token: token,
        public_token_expires_at: expiresAt,
      },
    });

    return { token };
  }

  async getPublicLog(token: string) {
    const log = await this.prisma.log.findUnique({
      where: { public_token: token },
      include: {
        incident_category: true,
        resource_assignments: {
          include: {
            resource: true,
          },
        },
        status_history: { orderBy: { changed_at: 'asc' } },
        logAgencyCoordinations: {
          include: {
            agency: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });

    if (
      !log ||
      !log.public_token_expires_at ||
      log.public_token_expires_at < new Date()
    ) {
      throw new NotFoundException('Invalid or expired public link');
    }

    const coords = await this.getLogCoordinations(log.id);
    const manualCoords = coords.coordinations.map((c: any) => ({
      id: c.agency_id,
      agency_name: c.agency.name,
      agency_type: c.agency.type,
      status: c.status,
    }));
    const existingIds = new Set(manualCoords.map((c) => c.id));
    const recommendedCoords = coords.recommendedAgencies
      .filter((a: any) => !existingIds.has(a.id))
      .map((a: any) => ({
        id: a.id,
        agency_name: a.name,
        agency_type: a.type,
        status: 'recommended',
      }));

    return {
      id: log.id,
      reference_no: log.reference_no,
      status: log.status,
      source: log.source,
      created_at: log.created_at,
      caller_name: log.caller_name,
      caller_contact: log.caller_contact,
      description: log.description,
      address: log.address,
      barangay: log.barangay,
      latitude: log.latitude,
      longitude: log.longitude,
      weather_condition: log.weather_condition,
      incident_category: log.incident_category
        ? { name: log.incident_category.name }
        : null,
      resolved_at: log.resolved_at,
      channels: log.channels,
      needs: log.resource_assignments?.map((a) => a.resource.name) || [],
      status_history: log.status_history.map((entry) => ({
        previous_status: entry.previous_status,
        new_status: entry.new_status,
        changed_at: entry.changed_at,
        remarks: entry.remarks,
      })),
      agency_coordinations: [...manualCoords, ...recommendedCoords],
    };
  }

  async getResidentLogByCallId(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        log: {
          include: {
            incident_category: true,
            resource_assignments: {
              include: {
                resource: true,
              },
            },
            status_history: { orderBy: { changed_at: 'asc' } },
          },
        },
      },
    });

    if (!call || !call.log) {
      throw new NotFoundException('Log not found');
    }

    const log = call.log;

    if (
      !log.resident_visible_until ||
      log.resident_visible_until < new Date()
    ) {
      throw new NotFoundException('Invalid or expired resident link');
    }

    // Return only public information (same as getPublicLog)
    return {
      id: log.id,
      reference_no: log.reference_no,
      status: log.status,
      source: log.source,
      created_at: log.created_at,
      caller_name: log.caller_name,
      caller_contact: log.caller_contact,
      description: log.description,
      address: log.address,
      barangay: log.barangay,
      latitude: log.latitude,
      longitude: log.longitude,
      weather_condition: log.weather_condition,
      incident_category: log.incident_category
        ? { name: log.incident_category.name }
        : null,
      resolved_at: log.resolved_at,
      channels: log.channels,
      needs: log.resource_assignments?.map((a) => a.resource.name) || [],
      status_history: log.status_history.map((entry) => ({
        previous_status: entry.previous_status,
        new_status: entry.new_status,
        changed_at: entry.changed_at,
        remarks: entry.remarks,
      })),
    };
  }

  async getResidentMyLogs(callIds: string[]) {
    if (!callIds || callIds.length === 0) return [];

    const logs = await this.prisma.log.findMany({
      where: {
        calls: {
          some: { id: { in: callIds } },
        },
        resident_visible_until: {
          gt: new Date(),
        },
      },
      include: {
        incident_category: { select: { name: true } },
        calls: {
          where: { id: { in: callIds } },
          select: { id: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return logs.map((log: any) => ({
      callId: log.calls[0]?.id,
      id: log.id,
      reference_no: log.reference_no,
      status: log.status,
      created_at: log.created_at,
      resolved_at: log.resolved_at,
      category: log.incident_category?.name || 'Uncategorized',
    }));
  }

  async getLogCoordinations(logId: string) {
    const log = await this.prisma.log.findUnique({
      where: { id: logId },
      include: {
        incident_category: {
          include: {
            agencies: {
              include: { agency: true },
            },
          },
        },
        resource_assignments: {
          include: { resource: true },
        },
        logAgencyCoordinations: {
          include: {
            agency: true,
            created_by: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Log not found');
    }

    const activeAgencies = await this.prisma.agency.findMany({
      where: { is_active: true },
    });
    const recommendedMap = new Map<string, any>();

    // Map from incident category
    log.incident_category?.agencies?.forEach((a: any) => {
      if (a.agency.is_active) recommendedMap.set(a.agency.id, a.agency);
    });

    // Map from requested needs (resources)
    log.resource_assignments?.forEach((ra: any) => {
      const resName = ra.resource.name.toLowerCase();
      const recommendTypes = new Set<string>();

      if (
        resName.includes('medical') ||
        resName.includes('ambulance') ||
        resName.includes('first aid') ||
        resName.includes('injury')
      ) {
        recommendTypes.add('medical');
      }
      if (resName.includes('rescue')) {
        recommendTypes.add('medical');
        recommendTypes.add('drrmo');
      }
      if (resName.includes('fire')) {
        recommendTypes.add('fire');
      }
      if (
        resName.includes('police') ||
        resName.includes('security') ||
        resName.includes('crime')
      ) {
        recommendTypes.add('police');
      }
      if (
        resName.includes('food') ||
        resName.includes('water') ||
        resName.includes('relief')
      ) {
        recommendTypes.add('drrmo');
      }

      activeAgencies.forEach((agency) => {
        if (recommendTypes.has(agency.type)) {
          recommendedMap.set(agency.id, agency);
        }
      });
    });

    return {
      recommendedAgencies: Array.from(recommendedMap.values()),
      coordinations: log.logAgencyCoordinations,
    };
  }

  async updateLogCoordination(
    logId: string,
    agencyId: string,
    dto: any,
    userId: string,
  ) {
    return this.prisma.logAgencyCoordination.upsert({
      where: {
        log_id_agency_id: { log_id: logId, agency_id: agencyId },
      },
      create: {
        log_id: logId,
        agency_id: agencyId,
        status: dto.status,
        remarks: dto.remarks,
        created_by_id: userId,
      },
      update: {
        status: dto.status,
        remarks: dto.remarks,
        created_by_id: userId,
      },
      include: {
        agency: true,
        created_by: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async removeLogCoordination(logId: string, agencyId: string) {
    return this.prisma.logAgencyCoordination.delete({
      where: {
        log_id_agency_id: { log_id: logId, agency_id: agencyId },
      },
    });
  }

  async revokePublicShareLink(logId: string) {
    const log = await this.prisma.log.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('Log not found');

    return this.prisma.log.update({
      where: { id: logId },
      data: {
        public_token: null,
        public_token_expires_at: null,
      },
    });
  }

  async validateAgencyToken(shareToken: string, agencyToken: string) {
    const log = await this.prisma.log.findUnique({
      where: { public_token: shareToken },
      select: {
        id: true,
        public_token_expires_at: true,
      },
    });

    if (
      !log ||
      !log.public_token_expires_at ||
      log.public_token_expires_at < new Date()
    ) {
      throw new NotFoundException('Invalid or expired public link');
    }

    const coord = await this.prisma.logAgencyCoordination.findUnique({
      where: { access_token: agencyToken },
      include: {
        agency: { select: { id: true, name: true, type: true } },
      },
    });

    if (!coord || coord.log_id !== log.id) {
      throw new NotFoundException('Invalid agency token or revoked access');
    }

    const updates = await this.prisma.coordinationUpdate.findMany({
      where: { log_id: log.id },
      include: {
        agency: { select: { id: true, name: true } },
        created_by: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      agency_id: coord.agency_id,
      name: coord.agency.name,
      type: coord.agency.type,
      can_submit_updates: true,
      coordination_updates: updates,
    };
  }

  async submitExternalUpdate(
    shareToken: string,
    dto: {
      agency_token: string;
      message: string;
    },
  ) {
    // Validate share token
    const log = await this.prisma.log.findUnique({
      where: { public_token: shareToken },
      select: { id: true, public_token_expires_at: true },
    });

    if (
      !log ||
      !log.public_token_expires_at ||
      log.public_token_expires_at < new Date()
    ) {
      throw new NotFoundException('Invalid or expired public link');
    }

    // Validate agency token
    const coord = await this.prisma.logAgencyCoordination.findUnique({
      where: { access_token: dto.agency_token },
    });

    if (!coord || coord.log_id !== log.id) {
      throw new NotFoundException('Invalid agency token or revoked access');
    }

    const update = await this.prisma.coordinationUpdate.create({
      data: {
        log_id: log.id,
        agency_id: coord.agency_id,
        message: dto.message,
        source: 'external',
      },
      include: {
        agency: { select: { name: true } },
      },
    });

    this.logsGateway.broadcastCoordinationUpdate(log.id, update);
    return update;
  }

  async createInternalCoordinationUpdate(
    logId: string,
    dto: { message: string },
    userId: string,
  ) {
    const log = await this.prisma.log.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('Log not found');

    const update = await this.prisma.coordinationUpdate.create({
      data: {
        log_id: logId,
        created_by_id: userId,
        message: dto.message,
        source: 'internal',
      },
      include: {
        created_by: { select: { id: true, name: true } },
      },
    });

    this.logsGateway.broadcastCoordinationUpdate(logId, update);
    return update;
  }

  async getCoordinationUpdates(logId: string) {
    return this.prisma.coordinationUpdate.findMany({
      where: { log_id: logId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
        created_by: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
