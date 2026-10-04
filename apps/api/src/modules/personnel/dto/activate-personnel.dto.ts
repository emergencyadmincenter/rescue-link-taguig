import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ActivatePersonnelDto {
  @IsNotEmpty({ message: 'Activation token is required' })
  @IsString()
  token!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}
