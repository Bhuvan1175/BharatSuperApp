import { 
 Body, 
 Controller, 
 Post, 
 UseGuards 
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';


@Controller('auth')
export class AuthController {


constructor(
 private readonly authService:AuthService
){}



@Post('send-otp')
sendOtp(
 @Body() sendOtpDto:SendOtpDto
){

 return this.authService.sendOtp(sendOtpDto);

}




@Post('verify-otp')
verifyOtp(
 @Body() verifyOtpDto:VerifyOtpDto
){

 return this.authService.verifyOtp(verifyOtpDto);

}





@UseGuards(JwtAuthGuard)
@Post('logout')
logout(
 @CurrentUser() user:any
){

 return this.authService.logout(user.id);

}





@Post('refresh')
refresh(
 @Body() refreshTokenDto:RefreshTokenDto
){

 return this.authService.refreshToken(
   refreshTokenDto.refreshToken
 );

}


}