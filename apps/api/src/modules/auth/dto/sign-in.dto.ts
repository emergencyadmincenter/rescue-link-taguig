import { BadRequestException } from '@nestjs/common';

export class SignInDto {
  email: string;
  password: string;

  constructor(data: any) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body is required',
        },
      });
    }

    const errors: string[] = [];

    // Validate email
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Email must be a valid email address');
    }

    // Validate password
    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required');
    } else if (data.password.trim().length === 0) {
      errors.push('Password must not be empty');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: errors.join('; ') },
      });
    }

    this.email = data.email.trim().toLowerCase();
    this.password = data.password;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
