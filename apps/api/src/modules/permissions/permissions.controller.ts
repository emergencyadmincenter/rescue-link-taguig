import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll() {
    const permissions = await this.permissionsService.findAll();
    return ApiResponse.success(permissions);
  }

  @Post()
  async create(@Body() dto: CreatePermissionDto) {
    if (!dto.name || !dto.resource || !dto.action) {
      throw new BadRequestException('name, resource, and action are required');
    }
    const permission = await this.permissionsService.create(dto);
    return ApiResponse.success(permission);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    const permission = await this.permissionsService.update(id, dto);
    return ApiResponse.success(permission);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.permissionsService.remove(id);
    return ApiResponse.success({ deleted: true });
  }
}
