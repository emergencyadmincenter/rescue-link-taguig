import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { CommunicationMethod } from '../../../generated/prisma/client';

export class CreateEmergencyDto {
  @IsEnum(CommunicationMethod)
  communicationMethod: 'voice' | 'chat';

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
