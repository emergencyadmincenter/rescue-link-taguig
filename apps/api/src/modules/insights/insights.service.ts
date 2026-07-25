import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

interface InsightsFilters {
  dateFrom?: string;
  dateTo?: string;
  barangay?: string;
  incidentCategoryId?: string;
}

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  // In-memory cache for heavy queries (10 minutes)
  private workloadCache: { data: any; expiresAt: number } | null = null;
  private responseTimeCache: { data: any; expiresAt: number } | null = null;
  private readonly CACHE_TTL = 10 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async getIncidents(filters: InsightsFilters) {
    const where: Prisma.LogWhereInput = {
      latitude: { not: null },
      longitude: { not: null },
    };

    if (filters.dateFrom || filters.dateTo) {
      where.created_at = {};
      if (filters.dateFrom) where.created_at.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.created_at.lte = new Date(filters.dateTo);
    }

    if (filters.barangay) {
      where.barangay = filters.barangay;
    }

    if (filters.incidentCategoryId) {
      where.incident_category_id = filters.incidentCategoryId;
    }

    const logs = await this.prisma.log.findMany({
      where,
      select: {
        id: true,
        reference_no: true,
        latitude: true,
        longitude: true,
        status: true,
        incident_category: {
          select: { name: true }
        },
        barangay: true,
        created_at: true,
        resolved_at: true,
      },
      orderBy: { created_at: 'desc' },
      take: 1000, // Limit for performance on map
    });

    return logs.map(l => ({
      ...l,
      incident_type: l.incident_category?.name || null,
      incident_category: undefined
    }));
  }

  async getResponseTimesByBarangay() {
    if (this.responseTimeCache && this.responseTimeCache.expiresAt > Date.now()) {
      return this.responseTimeCache.data;
    }

    // Use raw query for efficient time difference aggregation
    const result = await this.prisma.$queryRaw`
      SELECT
        barangay,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_response_time_seconds,
        COUNT(*) as total_resolved
      FROM logs
      WHERE status = 'resolved' AND barangay IS NOT NULL AND resolved_at IS NOT NULL
      GROUP BY barangay
      ORDER BY avg_response_time_seconds DESC
    `;

    // Prisma returns BigInt for COUNT, convert to Number
    const formattedResult = (result as any[]).map(row => ({
      barangay: row.barangay,
      avg_response_time_seconds: Number(row.avg_response_time_seconds),
      total_resolved: Number(row.total_resolved)
    }));

    this.responseTimeCache = {
      data: formattedResult,
      expiresAt: Date.now() + this.CACHE_TTL,
    };

    return formattedResult;
  }

  async getCoordinatorWorkload() {
    if (this.workloadCache && this.workloadCache.expiresAt > Date.now()) {
      return this.workloadCache.data;
    }

    const result = await this.prisma.log.groupBy({
      by: ['assigned_coordinator_id'],
      _count: {
        id: true,
      },
      where: {
        assigned_coordinator_id: { not: null },
      },
    });

    // Fetch user details for these coordinators
    const coordinatorIds = result.map((r) => r.assigned_coordinator_id as string);
    const users = await this.prisma.user.findMany({
      where: { id: { in: coordinatorIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const formattedResult = result.map((r) => ({
      coordinator_id: r.assigned_coordinator_id,
      coordinator_name: userMap.get(r.assigned_coordinator_id as string) || 'Unknown',
      handled_cases: r._count.id,
    })).sort((a, b) => b.handled_cases - a.handled_cases);

    this.workloadCache = {
      data: formattedResult,
      expiresAt: Date.now() + this.CACHE_TTL,
    };

    return formattedResult;
  }

  async getPeakTimes() {
    // Note: ISODOW returns 1 (Monday) to 7 (Sunday)
    const result = await this.prisma.$queryRaw`
      SELECT 
        EXTRACT(ISODOW FROM created_at) as day_of_week,
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        COUNT(*) as count
      FROM logs
      GROUP BY day_of_week, hour_of_day
    `;

    return (result as any[]).map(r => ({
      dayOfWeek: Number(r.day_of_week),
      hourOfDay: Number(r.hour_of_day),
      count: Number(r.count),
    }));
  }

  async getIncidentCategories() {
    return this.prisma.incidentCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
