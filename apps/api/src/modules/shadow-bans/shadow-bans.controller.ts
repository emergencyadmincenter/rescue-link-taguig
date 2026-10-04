import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ShadowBansService } from './shadow-bans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Request } from 'express';

@Controller('shadow-bans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShadowBansController {
  constructor(private readonly shadowBansService: ShadowBansService) {}

  @Get('call/:callId/status')
  @Roles('admin', 'coordinator')
  async getShadowBanStatus(@Param('callId') callId: string) {
    const status = await this.shadowBansService.getStatusByCall(callId);
    return { success: true, data: status };
  }

  @Post('call/:callId/toggle')
  @Roles('coordinator')
  async toggleShadowBan(
    @Param('callId') callId: string,
    @Body()
    dto: {
      action: 'ban' | 'unban';
      reason: string;
      durationMs?: number | null;
      violationCategory?: string;
      severity?: string;
      details?: string;
    },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub;
    if (
      dto.durationMs !== undefined &&
      dto.durationMs !== null &&
      (!Number.isFinite(dto.durationMs) || dto.durationMs <= 0)
    ) {
      throw new BadRequestException('durationMs must be a positive number');
    }
    const expiresAt = dto.durationMs
      ? new Date(Date.now() + dto.durationMs)
      : undefined;
    await this.shadowBansService.toggleShadowBan(
      callId,
      dto.action,
      dto.reason,
      userId,
      expiresAt,
      dto.violationCategory,
      dto.severity,
      dto.details,
    );
    return { success: true };
  }
}
