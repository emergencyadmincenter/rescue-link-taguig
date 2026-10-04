import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdatePersonnelDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;
}
