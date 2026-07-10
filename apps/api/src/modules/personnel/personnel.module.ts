import { Module } from '@nestjs/common';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';

@Module({
  controllers: [PersonnelController],
  providers: [PersonnelService],
})
export class PersonnelModule {}
