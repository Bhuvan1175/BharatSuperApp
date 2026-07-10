import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
}