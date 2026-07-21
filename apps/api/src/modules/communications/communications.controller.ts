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
} from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Controller('calls')
export class CommunicationsController {
  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('emergency')
  async createEmergencyCall(
    @Body()
    dto: {
      communicationMethod: 'voice' | 'chat';
      latitude?: number;
      longitude?: number;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const reference_no = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

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
        channels: [dto.communicationMethod],
        description: 'Auto-generated emergency log.',
      },
    });

    const call = await this.prisma.call.create({
      data: {
        communication_method: dto.communicationMethod,
        status: 'ringing',
        latitude: dto.latitude,
        longitude: dto.longitude,
        log_id: log.id,
      },
    });

    await this.communicationsService.startRouting(
      call.id,
      dto.communicationMethod,
      log.id,
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    res.cookie(`resident_call_${call.id}`, 'true', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: cookieDomain,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
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
      throw new UnauthorizedException(
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
}
