import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+:[a-z0-9_]+$/, {
    message: 'Name must follow resource:action format (e.g., users:view)',
  })
  name!: string;

  @IsString()
  @IsNotEmpty()
  resource!: string;

  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9_]+:[a-z0-9_]+$/, {
    message: 'Name must follow resource:action format (e.g., users:view)',
  })
  name?: string;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
