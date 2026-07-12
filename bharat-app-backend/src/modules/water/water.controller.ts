import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { WaterService } from './water.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

class CreateWaterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

/**
 * Second example — identical pattern, different manager role. Proves the
 * approach scales: each module gates MANAGE to its own *_MANAGER role while
 * VIEW stays open to any authenticated user.
 */
@Controller('water')
export class WaterController {
  constructor(private readonly waterService: WaterService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.waterService.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WATER_MANAGER')
  @Post()
  create(@Body() dto: CreateWaterDto) {
    return this.waterService.create(dto.name);
  }
}
