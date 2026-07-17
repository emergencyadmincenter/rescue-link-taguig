import { Body, Controller, Get, Post, Query, Patch, Param, Delete, Put } from '@nestjs/common';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { ActivatePersonnelDto } from './dto/activate-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';

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

  @Post(':id/resend-activation')
  async resendActivation(@Param('id') id: string) {
    return this.personnelService.resendActivation(id);
  }

  @Patch(':id')
  async updatePersonnel(@Param('id') id: string, @Body() dto: UpdatePersonnelDto) {
    return this.personnelService.updatePersonnel(id, dto);
  }

  @Post(':id/deactivate')
  async deactivatePersonnel(@Param('id') id: string) {
    return this.personnelService.deactivatePersonnel(id);
  }

  @Post(':id/reactivate')
  async reactivatePersonnel(@Param('id') id: string) {
    return this.personnelService.reactivatePersonnel(id);
  }

  @Delete(':id')
  async removePersonnel(@Param('id') id: string) {
    return this.personnelService.removePersonnel(id);
  }
}
