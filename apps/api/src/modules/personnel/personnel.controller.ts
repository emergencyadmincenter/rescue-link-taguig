import { Controller, Get, Query } from '@nestjs/common';
import { PersonnelService } from './personnel.service';

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Get()
  getPersonnel(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.personnelService.getPersonnel(search, status);
  }
}
