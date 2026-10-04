import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRecipientDto {
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  organization_name!: string;

  @IsString()
  @IsOptional()
  contact_name?: string;
}
