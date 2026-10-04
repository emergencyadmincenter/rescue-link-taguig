import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCoordinationUpdateDto {
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  message!: string;
}

export class SubmitExternalUpdateDto extends CreateCoordinationUpdateDto {
  @IsString()
  @IsNotEmpty({ message: 'Agency token is required' })
  agency_token!: string;
}
