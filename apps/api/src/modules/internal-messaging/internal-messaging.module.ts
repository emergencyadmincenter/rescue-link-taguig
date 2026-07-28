import { Module } from '@nestjs/common';
import { InternalMessagingController } from './internal-messaging.controller';
import { InternalMessagingService } from './internal-messaging.service';
import { InternalMessagingGateway } from './internal-messaging.gateway';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InternalMessagingController],
  providers: [InternalMessagingService, InternalMessagingGateway],
  exports: [InternalMessagingService],
})
export class InternalMessagingModule {}
