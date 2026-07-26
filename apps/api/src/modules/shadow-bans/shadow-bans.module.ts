import { Module } from '@nestjs/common';
import { ShadowBansService } from './shadow-bans.service';
import { ShadowBansController } from './shadow-bans.controller';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ShadowBansService],
  controllers: [ShadowBansController],
  exports: [ShadowBansService],
})
export class ShadowBansModule {}
