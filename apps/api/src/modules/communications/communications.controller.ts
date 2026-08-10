import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommunicationsService } from './communications.service';
import { ShadowBansService } from '../shadow-bans/shadow-bans.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { LocationValidationService } from '../../common/services/location-validation.service';
import { FraudDetectionService } from '../../common/services/fraud-detection.service';
import { BarangayResolverService } from '../../common/services/barangay-resolver.service';

@Controller('calls')
export class CommunicationsController {
  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly locationValidationService: LocationValidationService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly shadowBansService: ShadowBansService,
    private readonly barangayResolverService: BarangayResolverService,
  ) {}

  @Post('emergency')
  async createEmergencyCall(
    @Body()
    dto: {
      communicationMethod: 'voice' | 'chat';
      latitude?: number;
      longitude?: number;
      locationAccuracy?: number;
      locationTimestamp?: Date;
      locationStatus?: string;
      device_uuid?: string;
      fingerprint_hash?: string;
    },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      const isInside = this.locationValidationService.isWithinTaguig(
        dto.latitude,
        dto.longitude,
      );
      if (!isInside) {
        throw new ForbiddenException(
          'Your location is outside Taguig City limits. Please call 911 or your local command center.',
        );
      }
    }

    const clientIp = this.fraudDetectionService.extractClientIp(req);

    // Shadow Ban Check (Layer 3)
    const shadowBan = await this.shadowBansService.getActiveBan(dto.device_uuid, dto.fingerprint_hash, clientIp);
    if (shadowBan) {
      // Create quarantined record and return success silently
      await this.shadowBansService.quarantineRequest(dto, dto.device_uuid, dto.fingerprint_hash, clientIp, shadowBan.reason);
      
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

      const fakeId = randomUUID();

      res.cookie(`resident_call_${fakeId}`, 'true', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: cookieDomain,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      });

      return { success: true, data: { id: fakeId } };
    }

    const reference_no = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const log = await this.prisma.log.create({
      data: {
        reference_no,
        source: dto.communicationMethod === 'voice' ? 'voice_call' : 'chat',
        status: 'active',
        caller_name: 'Unknown Resident',
        caller_contact: 'Unknown',
        address: 'Unknown',
        latitude: dto.latitude,
        longitude: dto.longitude,
        location_accuracy: dto.locationAccuracy,
        location_timestamp: dto.locationTimestamp ? new Date(dto.locationTimestamp) : undefined,
        location_status: dto.locationStatus,
        channels: [dto.communicationMethod],
        description: '',
        resident_visible_until: expiresAt,
      },
    });

    const call = await this.prisma.call.create({
      data: {
        communication_method: dto.communicationMethod,
        status: 'ringing',
        latitude: dto.latitude,
        longitude: dto.longitude,
        location_accuracy: dto.locationAccuracy,
        location_timestamp: dto.locationTimestamp ? new Date(dto.locationTimestamp) : undefined,
        location_status: dto.locationStatus,
        log_id: log.id,
      },
    });

    try {
      const assessmentPromise = this.fraudDetectionService.analyzeFraudRisk(clientIp, dto.latitude, dto.longitude).then((assessment) => {
        return this.fraudDetectionService.saveFraudAssessment(
          log.id,
          call.id,
          assessment,
          dto.latitude,
          dto.longitude,
          dto.device_uuid,
          dto.fingerprint_hash
        );
      });
      // 2 second timeout to ensure it never blocks the emergency request if ip-api is slow
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Fraud detection timeout')), 2000));
      await Promise.race([assessmentPromise, timeoutPromise]);
    } catch (err) {
      console.warn('Fraud assessment timed out or failed, continuing emergency processing...', err);
    }

    await this.communicationsService.startRouting(
      call.id,
      dto.communicationMethod,
      log.id,
    );

    // Auto-populate barangay from caller GPS coordinates.
    // The DB update is fire-and-forget; note that barangay resolution itself runs in-process.
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      const barangay = this.barangayResolverService.resolveBarangay(dto.latitude, dto.longitude);
      if (barangay) {
        this.prisma.log
          .update({ where: { id: log.id }, data: { barangay } })
          .catch((err) => console.error('Failed to set barangay on log:', err));
      }
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    res.cookie(`resident_call_${call.id}`, 'true', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: cookieDomain,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, data: { id: call.id } };
  }

  @Get(':id')
  async getCallDetails(@Param('id') id: string, @Req() req: Request) {
    const isResident = req.cookies[`resident_call_${id}`] === 'true';

    let user: any = null;
    const token =
      req.cookies['access_token'] ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);
    if (token) {
      try {
        user = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('jwt.secret'),
        });
      } catch (e) {}
    }

    const call = await this.prisma.call.findUnique({
      where: { id },
      include: {
        log: {
          include: {
            calls: { orderBy: { started_at: 'desc' } },
            messages: { orderBy: { created_at: 'asc' } },
            fraud_assessments: true,
          },
        },
      },
    });
    if (!call) throw new NotFoundException('Call not found');

    if (isResident) {
      return { success: true, data: { call, log: call.log } };
    }

    if (!user) {
      throw new UnauthorizedException('Access denied');
    }

    const isActive = call.status === 'active' || call.status === 'ringing';
    if (isActive && call.coordinator_id !== user.sub) {
      throw new ForbiddenException(
        'Access denied: Call is active and assigned to another coordinator',
      );
    }

    return { success: true, data: { call, log: call.log } };
  }

  @Post(':id/finalize')
  async finalizeCall(
    @Param('id') id: string,
    @Body()
    dto: {
      caller_name: string;
      caller_contact: string;
      address: string;
      description?: string;
      resource_ids?: string[];
    },
  ) {
    const call = await this.prisma.call.findUnique({ where: { id } });
    if (!call) throw new NotFoundException('Call not found');

    if (call.log_id) {
      const log = await this.prisma.log.update({
        where: { id: call.log_id },
        data: {
          caller_name: dto.caller_name,
          caller_contact: dto.caller_contact,
          address: dto.address,
          description: dto.description,
          status: 'resolved',
          resolved_at: new Date(),
        },
      });
      return { success: true, data: log };
    }

    const reference_no = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const log = await this.prisma.log.create({
      data: {
        reference_no,
        source: call.communication_method === 'voice' ? 'voice_call' : 'chat',
        status: 'resolved', // Finalized by coordinator
        resolved_at: new Date(),
        assigned_coordinator_id: call.coordinator_id,
        created_by_coordinator_id: call.coordinator_id,
        caller_name: dto.caller_name,
        caller_contact: dto.caller_contact,
        address: dto.address,
        description: dto.description,
        latitude: call.latitude,
        longitude: call.longitude,
        channels: [call.communication_method],
        resident_visible_until: expiresAt,
      },
    });

    if (dto.resource_ids && dto.resource_ids.length > 0) {
      await this.prisma.logResourceAssignment.createMany({
        data: dto.resource_ids.map((resource_id) => ({
          log_id: log.id,
          resource_id,
        })),
      });
    }

    await this.prisma.call.update({
      where: { id },
      data: {
        log_id: log.id,
        status: 'ended',
        ended_at: new Date(),
      },
    });

    // Also update any messages tied to this call to be tied to the log
    await this.prisma.message.updateMany({
      where: { call_id: id },
      data: { log_id: log.id },
    });

    await this.communicationsService.endCall(id);

    return { success: true, data: log };
  }

  @Post(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body()
    dto: {
      latitude?: number;
      longitude?: number;
      locationAccuracy?: number;
      locationTimestamp?: Date;
      locationStatus?: string;
    },
    @Req() req: Request,
  ) {
    const isResident = req.cookies[`resident_call_${id}`] === 'true';
    if (!isResident) {
      throw new UnauthorizedException('Access denied');
    }

    const call = await this.prisma.call.findUnique({ where: { id } });
    if (!call || !call.log_id) throw new NotFoundException('Call not found');

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      const isInside = this.locationValidationService.isWithinTaguig(
        dto.latitude,
        dto.longitude,
      );

      if (!isInside) {
        throw new ForbiddenException(
          'Your location is outside Taguig City limits.',
        );
      }
    }

    const log = await this.prisma.log.update({
      where: { id: call.log_id },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        location_accuracy: dto.locationAccuracy,
        location_timestamp: dto.locationTimestamp ? new Date(dto.locationTimestamp) : undefined,
        location_status: dto.locationStatus,
      },
    });

    // Auto-populate barangay from updated GPS coordinates if not already set.
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      const barangay = this.barangayResolverService.resolveBarangay(dto.latitude, dto.longitude);
      if (barangay) {
        this.prisma.log
          .update({ where: { id: call.log_id }, data: { barangay } })
          .catch((err) => console.error('Failed to update barangay on location update:', err));
      }
    }

    await this.prisma.call.update({
      where: { id },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        location_accuracy: dto.locationAccuracy,
        location_timestamp: dto.locationTimestamp ? new Date(dto.locationTimestamp) : undefined,
        location_status: dto.locationStatus,
      },
    });

    // Notify coordinator via socket if we have coordinates
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      this.communicationsService.emitToRoom(`call_${id}`, 'location_updated', {
        latitude: dto.latitude,
        longitude: dto.longitude,
      });

      // Re-run fraud detection silently
      const clientIp = this.fraudDetectionService.extractClientIp(req);
      
      // We fetch the most recent fraud assessment to get the device IDs if needed
      const prevAssessment = await this.prisma.fraudAssessment.findFirst({
        where: { call_id: id },
        orderBy: { created_at: 'desc' },
      });

      try {
        const assessment = await this.fraudDetectionService.analyzeFraudRisk(clientIp, dto.latitude, dto.longitude);
        await this.fraudDetectionService.saveFraudAssessment(
          log.id,
          call.id,
          assessment,
          dto.latitude,
          dto.longitude,
          prevAssessment?.device_uuid || undefined,
          prevAssessment?.fingerprint_hash || undefined
        );
      } catch (err) {
        console.warn('Fraud assessment failed during location update', err);
      }
    }

    return { success: true, data: log };
  }
}
