import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

interface InsightsFilters {
  dateFrom?: string;
  dateTo?: string;
  barangay?: string;
  incidentCategoryId?: string;
}

/** Parse a bare date string (YYYY-MM-DD) as start of day in Philippine Time (UTC+8) */
function parsePhDateStart(d: string): Date {
  return new Date(`${d}T00:00:00+08:00`);
}

/** Parse a bare date string (YYYY-MM-DD) as end of day in Philippine Time (UTC+8) */
function parsePhDateEnd(d: string): Date {
  return new Date(`${d}T23:59:59.999+08:00`);
}

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  // Caching removed to support real-time WebSocket dashboard updates

  constructor(private prisma: PrismaService) {}

  async getIncidents(filters: InsightsFilters) {
    const where: Prisma.LogWhereInput = {
      latitude: { not: null },
      longitude: { not: null },
    };

    if (filters.dateFrom || filters.dateTo) {
      where.created_at = {};
      if (filters.dateFrom) where.created_at.gte = parsePhDateStart(filters.dateFrom);
      if (filters.dateTo) where.created_at.lte = parsePhDateEnd(filters.dateTo);
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

  async getResponseTimesByBarangay(filters: InsightsFilters = {}) {
    const conditions: string[] = ["status = 'resolved'", "barangay IS NOT NULL"];

    if (filters.dateFrom) conditions.push(`created_at >= '${parsePhDateStart(filters.dateFrom).toISOString()}'`);
    if (filters.dateTo) conditions.push(`created_at <= '${parsePhDateEnd(filters.dateTo).toISOString()}'`);
    if (filters.barangay) conditions.push(`barangay = '${filters.barangay.replace(/'/g, "''")}'`);
    if (filters.incidentCategoryId) conditions.push(`incident_category_id = '${filters.incidentCategoryId.replace(/'/g, "''")}' `);

    const whereClause = conditions.join(' AND ');

    const result = await this.prisma.$queryRawUnsafe(`
      SELECT
        barangay,
        AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, created_at) - created_at))) as avg_response_time_seconds,
        COUNT(*) as total_resolved
      FROM logs
      WHERE ${whereClause}
      GROUP BY barangay
      ORDER BY avg_response_time_seconds DESC
    `);

    return (result as any[]).map(row => ({
      barangay: row.barangay,
      avg_response_time_seconds: Number(row.avg_response_time_seconds),
      total_resolved: Number(row.total_resolved)
    }));
  }

  async getCoordinatorWorkload(filters: InsightsFilters = {}) {
    const where: Prisma.LogWhereInput = { assigned_coordinator_id: { not: null } };
    if (filters.dateFrom || filters.dateTo) {
      where.created_at = {};
      if (filters.dateFrom) (where.created_at as any).gte = parsePhDateStart(filters.dateFrom);
      if (filters.dateTo) (where.created_at as any).lte = parsePhDateEnd(filters.dateTo);
    }
    if (filters.barangay) where.barangay = filters.barangay;
    if (filters.incidentCategoryId) where.incident_category_id = filters.incidentCategoryId;

    const result = await this.prisma.log.groupBy({
      by: ['assigned_coordinator_id'],
      _count: { id: true },
      where,
    });

    const coordinatorIds = result.map((r) => r.assigned_coordinator_id as string);
    const users = await this.prisma.user.findMany({
      where: { id: { in: coordinatorIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return result.map((r) => ({
      coordinator_id: r.assigned_coordinator_id,
      coordinator_name: userMap.get(r.assigned_coordinator_id as string) || 'Unknown',
      handled_cases: r._count.id,
    })).sort((a, b) => b.handled_cases - a.handled_cases);
  }

  async getPeakTimes(filters: InsightsFilters = {}) {
    const conditions: string[] = [];
    if (filters.dateFrom) conditions.push(`created_at >= '${parsePhDateStart(filters.dateFrom).toISOString()}'`);
    if (filters.dateTo) conditions.push(`created_at <= '${parsePhDateEnd(filters.dateTo).toISOString()}'`);
    if (filters.barangay) conditions.push(`barangay = '${filters.barangay.replace(/'/g, "''")}' `);
    if (filters.incidentCategoryId) conditions.push(`incident_category_id = '${filters.incidentCategoryId.replace(/'/g, "''")}' `);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.prisma.$queryRawUnsafe(`
      SELECT 
        EXTRACT(ISODOW FROM created_at) as day_of_week,
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        COUNT(*) as count
      FROM logs
      ${whereClause}
      GROUP BY day_of_week, hour_of_day
    `);

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
