import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ShadowBansService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultDurations = {
    low: 24 * 60 * 60 * 1000,
    high: 7 * 24 * 60 * 60 * 1000,
    critical: null,
  } as const;

  private readonly categorySeverities = {
    fake_rescue_call: 'high',
    spam: 'low',
    fraudulent_activity: 'critical',
    abusive_malicious_use: 'high',
    impersonation_identity_misuse: 'high',
    coordinated_system_abuse: 'critical',
  } as const;

  private readonly validCategories = new Set([
    'fake_rescue_call',
    'spam',
    'fraudulent_activity',
    'abusive_malicious_use',
    'impersonation_identity_misuse',
    'coordinated_system_abuse',
    'other',
  ]);

  private readonly validSeverities = new Set(['low', 'high', 'critical']);

  async getActiveBan(
    device_uuid?: string,
    fingerprint_hash?: string,
    client_ip?: string,
  ) {
    if (!device_uuid && !fingerprint_hash && !client_ip) return null;

    const orConditions: any[] = [];
    if (device_uuid) orConditions.push({ device_uuid });
    if (fingerprint_hash) orConditions.push({ fingerprint_hash });
    if (client_ip) orConditions.push({ client_ip });

    if (orConditions.length === 0) return null;

    const now = new Date();

    // Naturally expire any bans matching these identifiers that have expired
    await this.prisma.shadowBan.updateMany({
      where: {
        active: true,
        OR: orConditions,
        expires_at: { lte: now },
      },
      data: {
        active: false,
        unban_reason: 'Automatically expired',
        unbanned_at: now,
      },
    });

    return this.prisma.shadowBan.findFirst({
      where: {
        active: true,
        OR: orConditions,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async quarantineRequest(
    payload: any,
    device_uuid?: string,
    fingerprint_hash?: string,
    client_ip?: string,
    reason?: string,
  ) {
    return this.prisma.quarantinedEmergencyRequest.create({
      data: {
        original_payload: payload,
        device_uuid,
        fingerprint_hash,
        client_ip,
        communication_method: payload.communicationMethod,
        resident_latitude: payload.latitude,
        resident_longitude: payload.longitude,
        location_accuracy: payload.locationAccuracy,
        location_timestamp: payload.locationTimestamp
          ? new Date(payload.locationTimestamp)
          : undefined,
        location_status: payload.locationStatus,
        shadow_ban_reason: reason,
      },
    });
  }

  async toggleShadowBan(
    callId: string,
    action: 'ban' | 'unban',
    reason: string,
    coordinatorId: string,
    expires_at?: Date,
    violationCategory = 'other',
    severity?: string,
    details?: string,
  ) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        log: true,
        fraud_assessments: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!call || !call.log)
      throw new NotFoundException('Call or log not found');

    // Ownership validation
    const isActive = call.status === 'active' || call.status === 'ringing';
    if (isActive && call.coordinator_id !== coordinatorId) {
      throw new ForbiddenException(
        'Access denied: You do not own this active communication session',
      );
    }

    const fraudAssessment = call.fraud_assessments[0];
    const device_uuid = fraudAssessment?.device_uuid || undefined;
    const fingerprint_hash = fraudAssessment?.fingerprint_hash || undefined;
    const client_ip = fraudAssessment?.client_ip || undefined;
    const caller_contact = call.log.caller_contact || undefined;

    if (!device_uuid && !fingerprint_hash && !client_ip) {
      throw new NotFoundException(
        'Cannot apply shadow ban: No identifiers found for this resident.',
      );
    }

    if (action === 'ban') {
      if (!reason?.trim()) {
        throw new BadRequestException(
          'A reason is required to apply a shadow ban',
        );
      }
      if (!this.validCategories.has(violationCategory)) {
        throw new BadRequestException('Invalid shadow-ban violation category');
      }
      const categorySeverity =
        this.categorySeverities[
          violationCategory as keyof typeof this.categorySeverities
        ];
      if (categorySeverity && severity && severity !== categorySeverity) {
        throw new BadRequestException(
          'This violation category has a fixed severity under the enforcement policy',
        );
      }
      const effectiveSeverity = categorySeverity ?? severity ?? 'low';
      if (!this.validSeverities.has(effectiveSeverity)) {
        throw new BadRequestException('Invalid shadow-ban severity');
      }

      const defaultDuration = this.defaultDurations[effectiveSeverity];
      if (severity === 'critical' && expires_at !== undefined) {
        throw new BadRequestException(
          'Critical violations require an indefinite restriction',
        );
      }
      if (
        severity === 'high' &&
        expires_at &&
        expires_at.getTime() - Date.now() < 24 * 60 * 60 * 1000
      ) {
        throw new BadRequestException(
          'High-severity violations require at least a 24-hour restriction',
        );
      }
      const usesPolicyDuration = Boolean(categorySeverity || severity);
      const effectiveExpiresAt = usesPolicyDuration
        ? defaultDuration === null
          ? undefined
          : new Date(Date.now() + defaultDuration)
        : expires_at;

      await this.prisma.shadowBan.create({
        data: {
          device_uuid,
          fingerprint_hash,
          client_ip,
          caller_contact,
          reason,
          violation_category: violationCategory as any,
          severity: effectiveSeverity as any,
          details: details?.trim() || undefined,
          created_by_id: coordinatorId,
          active: true,
          expires_at: effectiveExpiresAt,
        },
      });
    } else {
      // Find all active bans matching these identifiers and set active to false
      const orConditions: any[] = [];
      if (device_uuid) orConditions.push({ device_uuid });
      if (fingerprint_hash) orConditions.push({ fingerprint_hash });
      if (client_ip) orConditions.push({ client_ip });

      await this.prisma.shadowBan.updateMany({
        where: {
          active: true,
          OR: orConditions,
        },
        data: {
          active: false,
          unban_reason: reason, // In this case reason acts as unban_reason
          unbanned_at: new Date(),
          unbanned_by_id: coordinatorId,
        },
      });
    }
  }

  async isShadowBannedByCall(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        fraud_assessments: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!call) return false;

    const fraudAssessment = call.fraud_assessments[0];
    if (!fraudAssessment) return false;

    const ban = await this.getActiveBan(
      fraudAssessment.device_uuid || undefined,
      fraudAssessment.fingerprint_hash || undefined,
      fraudAssessment.client_ip,
    );
    return ban;
  }

  async getStatusByCall(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        fraud_assessments: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (!call) throw new NotFoundException('Call not found');

    const assessment = call.fraud_assessments[0];
    if (!assessment) return { isBanned: false, current: null, history: [] };

    const identifiers = [
      assessment.device_uuid
        ? { device_uuid: assessment.device_uuid }
        : undefined,
      assessment.fingerprint_hash
        ? { fingerprint_hash: assessment.fingerprint_hash }
        : undefined,
      assessment.client_ip ? { client_ip: assessment.client_ip } : undefined,
    ].filter(Boolean) as any[];

    const now = new Date();
    await this.prisma.shadowBan.updateMany({
      where: {
        active: true,
        OR: identifiers,
        expires_at: { lte: now },
      },
      data: {
        active: false,
        unban_reason: 'Automatically expired',
        unbanned_at: now,
      },
    });

    const history = await this.prisma.shadowBan.findMany({
      where: { OR: identifiers },
      orderBy: { created_at: 'desc' },
      include: {
        created_by: { select: { id: true, name: true } },
        unbanned_by: { select: { id: true, name: true } },
      },
    });

    const current = history.find(
      (ban) => ban.active && (!ban.expires_at || ban.expires_at > now),
    );

    return {
      isBanned: Boolean(current),
      current: current ?? null,
      history,
    };
  }
}
