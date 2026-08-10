import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UsePipes,
  Req,
  UnauthorizedException,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { LogsService } from './logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('logs')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async findAll(@Query() query: QueryLogsDto) {
    const result = await this.logsService.findAll(query);
    return ApiResponse.success(result);
  }

  @Get('status-counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async getStatusCounts(@CurrentUser() user: any) {
    const result = await this.logsService.getStatusCounts(user.sub);
    return ApiResponse.success(result);
  }

  @Get('resources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async getResources() {
    const result = await this.logsService.getResources();
    return ApiResponse.success(result);
  }

  @Get('public/:token')
  async getPublicLog(@Param('token') token: string) {
    const result = await this.logsService.getPublicLog(token);
    return ApiResponse.success(result);
  }

  @Get('resident/my-logs')
  async getResidentMyLogs(@Req() req: Request) {
    const callIds: string[] = [];
    if (req.cookies) {
      for (const [key, value] of Object.entries(req.cookies)) {
        if (key.startsWith('resident_call_') && value === 'true') {
          callIds.push(key.replace('resident_call_', ''));
        }
      }
    }
    
    const result = await this.logsService.getResidentMyLogs(callIds);
    return ApiResponse.success(result);
  }

  @Get('resident/call/:callId')
  async getResidentLogByCallId(@Param('callId') callId: string, @Req() req: Request) {
    const isResident = req.cookies[`resident_call_${callId}`] === 'true';
    if (!isResident) {
      throw new NotFoundException('Log not found');
    }
    
    const result = await this.logsService.getResidentLogByCallId(callId);
    return ApiResponse.success(result);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async findOne(@Param('id') id: string) {
    const result = await this.logsService.findOne(id);
    return ApiResponse.success(result);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async create(
    @Body() createLogDto: CreateLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.logsService.create(createLogDto, user.sub);
    return ApiResponse.success(result);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async shareLog(@Param('id') id: string) {
    const result = await this.logsService.generateShareLink(id);
    return ApiResponse.success(result);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async update(
    @Param('id') id: string,
    @Body() updateLogDto: UpdateLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.logsService.update(id, updateLogDto, user.sub);
    return ApiResponse.success(result);
  }
}
