import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}


  async sendOtp(sendOtpDto: SendOtpDto) {

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();


    await this.redisService.set(
      `otp:${sendOtpDto.email}`,
      otp,
      300,
    );


    // Deliver the OTP by email. The OTP is never logged or returned.
    await this.emailService.sendOtpEmail(
      sendOtpDto.email,
      otp,
    );


    return {
      success:true,
      message:'OTP sent successfully',
      email:sendOtpDto.email,
    };

  }



  async verifyOtp(
    verifyOtpDto: VerifyOtpDto
  ) {


    const savedOtp = await this.redisService.get(
      `otp:${verifyOtpDto.email}`,
    );


    if(!savedOtp){

      throw new UnauthorizedException(
        'OTP expired or not found'
      );

    }


    if(savedOtp !== verifyOtpDto.otp){

      throw new UnauthorizedException(
        'Invalid OTP'
      );

    }


    await this.redisService.del(
      `otp:${verifyOtpDto.email}`
    );



    let user = await this.prisma.user.findUnique({

      where:{
        email:verifyOtpDto.email
      }

    });



    if(!user){

      user = await this.prisma.user.create({

        data:{
          email:
          verifyOtpDto.email,

          isVerified:true,
        }

      });

    }



    // ACCESS TOKEN

    const accessToken =
    await this.jwtService.signAsync(

      {
        sub:user.id,
        email:user.email,
      },

      {

        secret:process.env.JWT_SECRET,

        expiresIn:'15m'

      }

    );




    // REFRESH TOKEN

    const refreshToken =
    await this.jwtService.signAsync(

      {
        sub:user.id,
      },

      {

        secret:process.env.JWT_REFRESH_SECRET,

        expiresIn:'30d'

      }

    );




    // SAVE REFRESH TOKEN

    await this.prisma.user.update({

      where:{
        id:user.id
      },

      data:{

        refreshToken,

        lastLoginAt:new Date(),

        lastLoginDevice:'Web',

      }

    });




    return {

      success:true,

      message:'Login successful',

      accessToken,

      refreshToken,

      user,

    };


  }





  // REFRESH TOKEN ROTATION

  async refreshToken(
    refreshToken:string
  ){


    let payload;


    try{


      payload =
      await this.jwtService.verifyAsync(

        refreshToken,

        {

          secret:
          process.env.JWT_REFRESH_SECRET

        }

      );


    }

    catch(error){

      throw new UnauthorizedException(
        'Invalid or expired refresh token'
      );

    }




    const user =
    await this.prisma.user.findUnique({

      where:{
        id:payload.sub
      }

    });



    if(!user){

      throw new UnauthorizedException(
        'User not found'
      );

    }



    // OLD TOKEN CHECK

    if(
      user.refreshToken !== refreshToken
    ){

      throw new UnauthorizedException(
        'Refresh token already used'
      );

    }




    // NEW ACCESS TOKEN

    const accessToken =
    await this.jwtService.signAsync(

      {
        sub:user.id,
        email:user.email,
      },

      {

        secret:process.env.JWT_SECRET,

        expiresIn:'15m'

      }

    );




    // NEW REFRESH TOKEN

    const newRefreshToken =
    await this.jwtService.signAsync(

      {
        sub:user.id,
      },

      {

        secret:process.env.JWT_REFRESH_SECRET,

        expiresIn:'30d'

      }

    );




    // REPLACE OLD TOKEN

    await this.prisma.user.update({

      where:{
        id:user.id
      },

      data:{
        refreshToken:newRefreshToken
      }

    });





    return {

      success:true,

      accessToken,

      refreshToken:newRefreshToken,

    };


  }







  // LOGOUT

  async logout(
    userId:string
  ){


    await this.prisma.user.update({

      where:{
        id:userId
      },

      data:{

        refreshToken:null

      }

    });



    return {

      success:true,

      message:
      'Logged out successfully'

    };


  }


}
