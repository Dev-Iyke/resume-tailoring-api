import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  verifyEmail(@Body() payload: VerifyEmailDto) {
    return this.authService.verifyEmail(payload);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  resendVerification(@Body() payload: ResendVerificationDto) {
    return this.authService.resendVerification(payload);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }
}
