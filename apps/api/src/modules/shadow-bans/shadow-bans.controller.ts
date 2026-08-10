import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ShadowBansService } from './shadow-bans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('shadow-bans')
@UseGuards(JwtAuthGuard)
export class ShadowBansController {
  constructor(private readonly shadowBansService: ShadowBansService) {}

  @Get('call/:callId/status')
  async getShadowBanStatus(@Param('callId') callId: string) {
    const isBanned = await this.shadowBansService.isShadowBannedByCall(callId);
    return { success: true, data: { isBanned } };
  }

  @Post('call/:callId/toggle')
  async toggleShadowBan(
    @Param('callId') callId: string,
    @Body()
    dto: {
      action: 'ban' | 'unban';
      reason: string;
      durationMs?: number | null;
    },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub;
    const expiresAt = dto.durationMs
      ? new Date(Date.now() + dto.durationMs)
      : undefined;
    await this.shadowBansService.toggleShadowBan(
      callId,
      dto.action,
      dto.reason,
      userId,
      expiresAt,
    );
    return { success: true };
  }
}
