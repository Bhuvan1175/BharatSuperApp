import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(sendOtpDto: SendOtpDto) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.redisService.set(
      `otp:${sendOtpDto.phoneNumber}`,
      otp,
      300, // 5 minutes
    );

    console.log(`📱 OTP for ${sendOtpDto.phoneNumber}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      phoneNumber: sendOtpDto.phoneNumber,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const savedOtp = await this.redisService.get(
      `otp:${verifyOtpDto.phoneNumber}`,
    );

    if (!savedOtp) {
      throw new UnauthorizedException('OTP expired or not found');
    }

    if (savedOtp !== verifyOtpDto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // OTP verified, delete it from Redis
    await this.redisService.del(`otp:${verifyOtpDto.phoneNumber}`);

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: {
        phoneNumber: verifyOtpDto.phoneNumber,
      },
    });

    // Create new user if not found
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneNumber: verifyOtpDto.phoneNumber,
          isVerified: true,
        },
      });

      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        phoneNumber: user.phoneNumber,
      });

      return {
        success: true,
        message: 'User created successfully',
        accessToken,
        user,
      };
    }

    // Existing user login
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      phoneNumber: user.phoneNumber,
    });

    return {
      success: true,
      message: 'Login successful',
      accessToken,
      user,
    };
  }
}