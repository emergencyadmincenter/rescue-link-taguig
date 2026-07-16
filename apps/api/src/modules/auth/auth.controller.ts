import { Controller, Post, Get, Body, HttpCode, HttpStatus, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return ApiResponse.success({ user });
  }

  @Throttle({
    default: {
      limit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '5', 10),
      ttl: parseInt(process.env.THROTTLE_AUTH_TTL ?? '60000', 10),
    },
  })
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) response: Response) {
    const dto = new SignInDto(signInDto);
    const result = await this.authService.signIn(dto);
    
    // Set HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookie('access_token', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // Use 'strict' or 'lax'
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    
    // Do not return token in the body
    return ApiResponse.success({ user: result.user });
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  async signOut(@Res({ passthrough: true }) response: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
    
    return ApiResponse.success({ message: 'Signed out successfully' });
  }
}
