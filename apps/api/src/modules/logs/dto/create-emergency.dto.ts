import { IsOptional, IsEnum, IsNumber, IsString } from 'class-validator';
import { CommunicationMethod } from '../../../generated/prisma/client';

export class CreateEmergencyDto {
  @IsEnum(CommunicationMethod)
  communicationMethod!: 'voice' | 'chat';

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  device_uuid?: string;

  @IsOptional()
  @IsString()
  fingerprint_hash?: string;
}
