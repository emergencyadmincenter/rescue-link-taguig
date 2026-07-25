import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('insights')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'coordinator')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('incidents')
  async getIncidents(
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('barangay') barangay?: string,
    @Query('incident_category_id') incidentCategoryId?: string,
  ) {
    const data = await this.insightsService.getIncidents({
      dateFrom,
      dateTo,
      barangay,
      incidentCategoryId,
    });
    return ApiResponse.success(data);
  }

  @Get('response-times')
  async getResponseTimes() {
    const data = await this.insightsService.getResponseTimesByBarangay();
    return ApiResponse.success(data);
  }

  @Get('workload')
  async getWorkload() {
    const data = await this.insightsService.getCoordinatorWorkload();
    return ApiResponse.success(data);
  }

  @Get('peak-times')
  async getPeakTimes() {
    const data = await this.insightsService.getPeakTimes();
    return ApiResponse.success(data);
  }

  @Get('incident-categories')
  async getIncidentCategories() {
    const data = await this.insightsService.getIncidentCategories();
    return ApiResponse.success(data);
  }
}
