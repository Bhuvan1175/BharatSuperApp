import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationDataService } from './providers/location-data.service';
import { OpenAiLocationProvider } from './providers/openai-location.provider';
import { GovtLocationProvider } from './providers/govt-location.provider';

/**
 * LocationModule — shared State / District / City / Locality / Ward reference
 * data used by every module. PrismaService comes from the global PrismaModule.
 *
 * The provider trio (LocationDataService + OpenAI/Govt providers) powers
 * auto-fill of villages and wards.
 */
@Module({
  controllers: [LocationController],
  providers: [
    LocationService,
    LocationDataService,
    OpenAiLocationProvider,
    GovtLocationProvider,
  ],
  exports: [LocationService],
})
export class LocationModule {}
