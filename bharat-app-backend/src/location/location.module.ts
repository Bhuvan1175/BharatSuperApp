import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

/**
 * LocationModule — shared City / Locality reference data used by every module.
 * PrismaService comes from the global PrismaModule.
 */
@Module({
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
