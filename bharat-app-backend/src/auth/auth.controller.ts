import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';

import { VerifyOtpDto } from './dto/verify-otp.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }
  @Post('verify-otp')
verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
  return this.authService.verifyOtp(verifyOtpDto);
}
}