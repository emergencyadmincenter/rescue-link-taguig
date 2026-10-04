import { Module } from '@nestjs/common';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MailModule, AuthModule],
  controllers: [PersonnelController],
  providers: [PersonnelService, PrismaService],
})
export class PersonnelModule {}
