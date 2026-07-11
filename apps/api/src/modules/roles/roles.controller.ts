import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    const roles = await this.rolesService.findAll();
    return ApiResponse.success(roles);
  }

  @Get(':id/permissions')
  async getRolePermissions(@Param('id') id: string) {
    const permissions = await this.rolesService.getRolePermissions(id);
    return ApiResponse.success(permissions);
  }

  @Put(':id/permissions')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    // Minimal validation inline (if global pipes aren't fully configured)
    if (!dto || !Array.isArray(dto.permissionIds)) {
      throw new Error('permissionIds must be an array');
    }
    const permissions = await this.rolesService.updateRolePermissions(id, dto.permissionIds);
    return ApiResponse.success(permissions);
  }
}
