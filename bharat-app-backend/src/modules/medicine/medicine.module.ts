import { Module } from '@nestjs/common';
import { MedicineController } from './medicine.controller';
import { MedicineService } from './medicine.service';

/**
 * MedicineModule — the Medicine Store Dashboard domain: inventory + citizen
 * request workflow. PrismaService comes from the global PrismaModule.
 */
@Module({
  controllers: [MedicineController],
  providers: [MedicineService],
  exports: [MedicineService],
})
export class MedicineModule {}
