import { Module } from '@nestjs/common';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';
import { PrismaService } from '../../database/prisma/prisma.service';

@Module({
  controllers: [PersonnelController],
  providers: [PersonnelService, PrismaService],
})
export class PersonnelModule {}