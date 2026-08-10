import { Module } from '@nestjs/common';
import { CommunicationsGateway } from './communications.gateway';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { CommunicationsDebugController } from './communications-debug.controller';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LocationValidationService } from '../../common/services/location-validation.service';
import { BarangayResolverService } from '../../common/services/barangay-resolver.service';
import { FraudDetectionService } from '../../common/services/fraud-detection.service';
import { ShadowBansModule } from '../shadow-bans/shadow-bans.module';

@Module({
  imports: [PrismaModule, AuthModule, ShadowBansModule],
  providers: [
    CommunicationsGateway,
    CommunicationsService,
    LocationValidationService,
    FraudDetectionService,
    BarangayResolverService,
  ],
  controllers: [CommunicationsController, CommunicationsDebugController],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
