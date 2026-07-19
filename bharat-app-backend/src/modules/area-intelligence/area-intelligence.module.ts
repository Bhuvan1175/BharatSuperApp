import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AreaController } from './area.controller';
import { AreaService } from './area.service';
import { AreaAdminController } from './area-admin.controller';
import { AreaAdminService } from './area-admin.service';

import { AreaMasterService } from './area-master/area-master.service';

import { AreaScoringService } from './scoring/area-scoring.service';

import { AreaAiSummaryService } from './insights/area-ai-summary.service';

import { NearbyPlacesDataService } from './providers/nearby-places/nearby-places-data.service';
import { GooglePlacesProvider } from './providers/nearby-places/google-places.provider';
import { OsmPlacesProvider } from './providers/nearby-places/osm-places.provider';
import { TrafficDataService } from './providers/traffic/traffic-data.service';
import { GoogleTrafficProvider } from './providers/traffic/google-traffic.provider';
import { CrimeDataService } from './providers/crime/crime-data.service';
import { GovtCrimeProvider } from './providers/crime/govt-crime.provider';
import { HealthcareDataService } from './providers/healthcare/healthcare-data.service';
import { GovtHealthcareProvider } from './providers/healthcare/govt-healthcare.provider';
import { SchoolDataService } from './providers/schools/school-data.service';
import { GovtSchoolProvider } from './providers/schools/govt-school.provider';
import { InternetDataService } from './providers/internet/internet-data.service';
import { TraiInternetProvider } from './providers/internet/trai-internet.provider';

import { AreaDataCollectorService } from './collector/area-data-collector.service';

import { PropertyStatisticsService } from './property-stats/property-statistics.service';

import { AreaCacheService } from './cache/area-cache.service';

import { AreaMetricsService } from './metrics/area-metrics.service';

import { AREA_INTELLIGENCE_QUEUE } from './jobs/queues';
import { AreaIntelligenceProcessor } from './jobs/processors/area-intelligence.processor';
import { AreaIntelligenceScheduler } from './jobs/schedulers/area-intelligence.scheduler';

/**
 * Area Intelligence — new top-level domain module (docs/area-intelligence-architecture.md).
 * PrismaModule/RedisModule are @Global(), so they're not re-imported here.
 * Exports AreaMasterService/AreaScoringService for any future module (e.g. a
 * Property module) that needs to read area registries/scores.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD || undefined,
          tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: AREA_INTELLIGENCE_QUEUE }),
  ],
  controllers: [AreaController, AreaAdminController],
  providers: [
    AreaService,
    AreaAdminService,
    AreaMasterService,
    AreaScoringService,
    AreaAiSummaryService,
    NearbyPlacesDataService,
    GooglePlacesProvider,
    OsmPlacesProvider,
    TrafficDataService,
    GoogleTrafficProvider,
    CrimeDataService,
    GovtCrimeProvider,
    HealthcareDataService,
    GovtHealthcareProvider,
    SchoolDataService,
    GovtSchoolProvider,
    InternetDataService,
    TraiInternetProvider,
    AreaDataCollectorService,
    PropertyStatisticsService,
    AreaCacheService,
    AreaMetricsService,
    AreaIntelligenceProcessor,
    AreaIntelligenceScheduler,
  ],
  exports: [AreaMasterService, AreaScoringService],
})
export class AreaIntelligenceModule {}
