import { Body, Controller, Post } from '@nestjs/common';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';

@Controller('personnel')
export class PersonnelController {
  constructor(private personnelService: PersonnelService) {}

  @Post()
  async create(@Body() dto: CreatePersonnelDto) {
    return this.personnelService.create(dto);
  }
}