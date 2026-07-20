import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';

export class CreateLogDto {
  @IsString()
  @IsNotEmpty()
  caller_name: string;

  @IsString()
  @IsNotEmpty()
  caller_contact: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resource_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];
}
