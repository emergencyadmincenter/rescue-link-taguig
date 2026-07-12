import { IsOptional, IsString, IsEnum, IsNumber, IsArray } from 'class-validator';
import { LogStatus } from '../../../generated/prisma/client';

export class UpdateLogDto {
  @IsOptional()
  @IsString()
  caller_name?: string;

  @IsOptional()
  @IsString()
  caller_contact?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(LogStatus)
  status?: LogStatus;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  cancellation_reason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resource_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];

  @IsOptional()
  @IsString()
  assigned_coordinator_id?: string;
}
