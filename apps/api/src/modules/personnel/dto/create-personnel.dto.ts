import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePersonnelDto {
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsUUID('4', { message: 'A valid role must be selected' })
  role_id: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;
}