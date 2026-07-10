/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { profileImageMulterOptions } from './config/multer.config';
import { MulterExceptionFilter } from './filters/multer-exception.filter';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    console.log('Controller User:', user);
    return this.usersService.getProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('complete-profile')
  getCompleteProfile(@CurrentUser() user: any) {
    return this.usersService.getCompleteProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  searchUsers(
    @CurrentUser() user: any,
    @Query() searchUsersDto: SearchUsersDto,
  ) {
    return this.usersService.searchUsers(user.userId, searchUsersDto.query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-image')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('image', profileImageMulterOptions))
  uploadProfileImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.usersService.uploadProfileImage(user.userId, file.buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile-image')
  deleteProfileImage(@CurrentUser() user: any) {
    return this.usersService.deleteProfileImage(user.userId);
  }
}
