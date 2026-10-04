import { Module, forwardRef } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommunicationsModule } from '../communications/communications.module';
import { LogsGateway } from './logs.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => CommunicationsModule),
    JwtModule,
  ],
  controllers: [LogsController],
  providers: [LogsService, LogsGateway],
  exports: [LogsService],
})
export class LogsModule {}
