import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ShadowBansService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveBan(device_uuid?: string, fingerprint_hash?: string, client_ip?: string) {
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

  async quarantineRequest(payload: any, device_uuid?: string, fingerprint_hash?: string, client_ip?: string, reason?: string) {
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
        location_timestamp: payload.locationTimestamp ? new Date(payload.locationTimestamp) : undefined,
        location_status: payload.locationStatus,
        shadow_ban_reason: reason,
      },
    });
  }

  async toggleShadowBan(callId: string, action: 'ban' | 'unban', reason: string, coordinatorId: string, expires_at?: Date) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { 
        log: true, 
        fraud_assessments: { orderBy: { created_at: 'desc' }, take: 1 } 
      },
    });

    if (!call || !call.log) throw new NotFoundException('Call or log not found');

    // Ownership validation
    const isActive = call.status === 'active' || call.status === 'ringing';
    if (isActive && call.coordinator_id !== coordinatorId) {
      throw new ForbiddenException('Access denied: You do not own this active communication session');
    }

    const fraudAssessment = call.fraud_assessments[0];
    const device_uuid = fraudAssessment?.device_uuid || undefined;
    const fingerprint_hash = fraudAssessment?.fingerprint_hash || undefined;
    const client_ip = fraudAssessment?.client_ip || undefined;
    const caller_contact = call.log.caller_contact || undefined;

    if (!device_uuid && !fingerprint_hash && !client_ip) {
      throw new NotFoundException('Cannot apply shadow ban: No identifiers found for this resident.');
    }

    if (action === 'ban') {
      await this.prisma.shadowBan.create({
        data: {
          device_uuid,
          fingerprint_hash,
          client_ip,
          caller_contact,
          reason,
          created_by_id: coordinatorId,
          active: true,
          expires_at,
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
        },
      });
    }
  }

  async isShadowBannedByCall(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { fraud_assessments: { orderBy: { created_at: 'desc' }, take: 1 } },
    });

    if (!call) return false;
    
    const fraudAssessment = call.fraud_assessments[0];
    if (!fraudAssessment) return false;

    const ban = await this.getActiveBan(
      fraudAssessment.device_uuid || undefined,
      fraudAssessment.fingerprint_hash || undefined,
      fraudAssessment.client_ip
    );
    return ban;
  }
}
