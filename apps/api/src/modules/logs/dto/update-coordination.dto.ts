import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CoordinationStatus } from '../../../generated/prisma/client';

export class UpdateCoordinationDto {
  @IsEnum(CoordinationStatus)
  @IsNotEmpty()
  status!: CoordinationStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}
