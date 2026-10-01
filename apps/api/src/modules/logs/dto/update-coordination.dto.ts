import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum CoordinationStatus {
  pending = 'pending',
  contacted = 'contacted',
  completed = 'completed',
}

export class UpdateCoordinationDto {
  @IsEnum(CoordinationStatus)
  @IsNotEmpty()
  status: CoordinationStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}
