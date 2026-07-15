import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { ActivatePersonnelDto } from './dto/activate-personnel.dto';

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

  @Post()
  async create(@Body() dto: CreatePersonnelDto) {
    return this.personnelService.create(dto);
  }

  @Post('activate')
  async activate(@Body() dto: ActivatePersonnelDto) {
    return this.personnelService.activateAccount(dto);
  }
}
