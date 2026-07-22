import { Module } from '@nestjs/common';
import { CommunicationsGateway } from './communications.gateway';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { CommunicationsDebugController } from './communications-debug.controller';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LocationValidationService } from '../../common/services/location-validation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    CommunicationsGateway,
    CommunicationsService,
    LocationValidationService,
  ],
  controllers: [CommunicationsController, CommunicationsDebugController],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
