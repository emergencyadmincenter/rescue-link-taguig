import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InternalMessagingService } from './internal-messaging.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('internal-messaging/conversations')
export class InternalMessagingController {
  constructor(private readonly service: InternalMessagingService) {}

  @Get()
  getConversations(@CurrentUser() user: any) {
    return this.service.getConversations(user.sub);
  }

  @Post('direct')
  getOrCreateDirectConversation(
    @CurrentUser() user: any,
    @Body('userId') targetUserId: string,
  ) {
    return this.service.getOrCreateDirectConversation(user.sub, targetUserId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('group')
  createGroupConversation(
    @CurrentUser() user: any,
    @Body() dto: { title: string; participantIds?: string[] },
  ) {
    return this.service.createGroupConversation(
      user.sub,
      dto.title,
      dto.participantIds,
    );
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getMessages(id, user.sub);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Post(':id/participants')
  addParticipants(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('participantIds') participantIds: string[],
  ) {
    return this.service.addParticipants(id, user.sub, participantIds);
  }

  @Patch(':id/mute')
  toggleMute(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('isMuted') isMuted?: boolean,
  ) {
    return this.service.toggleMute(id, user.sub, isMuted);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markAsRead(id, user.sub);
  }
}
