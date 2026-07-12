import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { MedicineService } from './medicine.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

class CreateMedicineDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

/**
 * Example module API demonstrating the authorization rule (req 12):
 *   VIEW   (GET)  → any authenticated user, so citizens can read.
 *   MANAGE (POST) → only MEDICINE_MANAGER (SUPER_ADMIN bypasses RolesGuard).
 *
 * This is the exact pattern every future module controller follows — swap
 * 'MEDICINE_MANAGER' for the module's manager role.
 */
@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.medicineService.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Post()
  create(@Body() dto: CreateMedicineDto) {
    return this.medicineService.create(dto.name);
  }
}
