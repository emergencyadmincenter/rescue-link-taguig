import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class UpdateRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissionIds: string[];
}
