import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PersonnelService } from './personnel.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { ActivatePersonnelDto } from './dto/activate-personnel.dto';
import { UpdatePersonnelDto } from './dto/update-personnel.dto';

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  @Get()
  getPersonnel(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.personnelService.getPersonnel(search, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() dto: CreatePersonnelDto) {
    return this.personnelService.create(dto);
  }

  @Post('activate')
  async activate(@Body() dto: ActivatePersonnelDto) {
    return this.personnelService.activateAccount(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/resend-activation')
  async resendActivation(@Param('id') id: string) {
    return this.personnelService.resendActivation(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async updatePersonnel(
    @Param('id') id: string,
    @Body() dto: UpdatePersonnelDto,
  ) {
    return this.personnelService.updatePersonnel(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/deactivate')
  async deactivatePersonnel(@Param('id') id: string) {
    return this.personnelService.deactivatePersonnel(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/reactivate')
  async reactivatePersonnel(@Param('id') id: string) {
    return this.personnelService.reactivatePersonnel(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async removePersonnel(@Param('id') id: string) {
    return this.personnelService.removePersonnel(id);
  }
}
