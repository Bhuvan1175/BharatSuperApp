import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AmenityCategory } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NearbyPlacesDataService } from '../providers/nearby-places/nearby-places-data.service';
import { TrafficDataService } from '../providers/traffic/traffic-data.service';
import { CrimeDataService } from '../providers/crime/crime-data.service';
import { HealthcareDataService } from '../providers/healthcare/healthcare-data.service';
import { SchoolDataService } from '../providers/schools/school-data.service';
import { InternetDataService } from '../providers/internet/internet-data.service';
import {
  haversineDistanceMeters,
  walkTimeMinutes,
} from './normalization/geo-normalizer';

/** Search radius per amenity category, in meters. */
const RADIUS_BY_CATEGORY: Record<AmenityCategory, number> = {
  HOSPITAL: 5000,
  SCHOOL: 3000,
  POLICE: 3000,
  PARK: 3000,
  MARKET: 3000,
  ATM: 2000,
  BUS_STOP: 1500,
  METRO: 5000,
};

/**
 * The ONLY place that calls provider services (docs §6). Orchestrates
 * providers → normalization → persistence, always inside a background job,
 * never inline on an HTTP request. Normalizes units, dedupes by
 * `externalPlaceId`, attaches areaId, and writes rows.
 */
@Injectable()
export class AreaDataCollectorService {
  private readonly logger = new Logger(AreaDataCollectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nearbyPlaces: NearbyPlacesDataService,
    private readonly traffic: TrafficDataService,
    private readonly crime: CrimeDataService,
    private readonly healthcare: HealthcareDataService,
    private readonly schools: SchoolDataService,
    private readonly internet: InternetDataService,
  ) {}

  /** Loads the area with everything the providers need for context. */
  private async loadAreaContext(areaId: string) {
    const area = await this.prisma.areaMaster.findUnique({
      where: { id: areaId },
      include: {
        locality: {
          include: {
            city: { include: { district: { include: { state: true } } } },
          },
        },
      },
    });
    if (!area) throw new NotFoundException('Area not found');
    if (area.locality.latitude === null || area.locality.longitude === null) {
      return null; // Nothing to collect without coordinates — caller decides how to log this.
    }
    return area;
  }

  /**
   * Refresh nearby amenities for one area: fetch every category, upsert
   * NearbyAmenity + AreaNearbyAmenity. Returns how many join rows were
   * written (new + refreshed).
   */
  async collectNearby(areaId: string): Promise<number> {
    const area = await this.loadAreaContext(areaId);
    if (!area) {
      this.logger.warn(
        `Area ${areaId} has no coordinates — skipping nearby collection`,
      );
      return 0;
    }
    const lat = area.locality.latitude!;
    const lon = area.locality.longitude!;

    let written = 0;
    for (const category of Object.keys(
      RADIUS_BY_CATEGORY,
    ) as AmenityCategory[]) {
      const places = await this.nearbyPlaces.fetchNearby({
        latitude: lat,
        longitude: lon,
        radiusMeters: RADIUS_BY_CATEGORY[category],
        category,
      });

      for (const place of places) {
        const amenity = await this.prisma.nearbyAmenity.upsert({
          where: { externalPlaceId: place.externalPlaceId },
          create: {
            category: place.category,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            externalPlaceId: place.externalPlaceId,
            source: this.nearbyPlaces.activeProviderName(),
            rating: place.rating ?? null,
            lastSyncedAt: new Date(),
          },
          update: {
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            rating: place.rating ?? null,
            lastSyncedAt: new Date(),
          },
        });

        const distanceMeters = Math.round(
          haversineDistanceMeters(lat, lon, place.latitude, place.longitude),
        );

        await this.prisma.areaNearbyAmenity.upsert({
          where: { areaId_amenityId: { areaId, amenityId: amenity.id } },
          create: {
            areaId,
            amenityId: amenity.id,
            distanceMeters,
            walkTimeMin: walkTimeMinutes(distanceMeters),
            computedAt: new Date(),
          },
          update: {
            distanceMeters,
            walkTimeMin: walkTimeMinutes(distanceMeters),
            computedAt: new Date(),
          },
        });
        written++;
      }
    }

    return written;
  }

  /**
   * Refresh the AreaStatistic rows fed by the domain data services (traffic,
   * crime, healthcare, schools, internet). Each category writes at most a
   * couple of `statKey` rows, keyed by (areaId, statKey, asOfDate) so history
   * accumulates rather than being overwritten.
   */
  async collectStatistics(areaId: string): Promise<number> {
    const area = await this.loadAreaContext(areaId);
    if (!area) return 0;

    const lat = area.locality.latitude!;
    const lon = area.locality.longitude!;
    const district = area.locality.city.district.name;
    const state = area.locality.city.district.state.name;
    const cityLat = area.locality.latitude!; // no separate city centroid modeled yet — same point is a reasonable default
    const cityLon = area.locality.longitude!;
    const asOfDate = new Date();

    const rows: { statKey: string; value: number; source: string }[] = [];

    const [
      trafficResult,
      crimeResult,
      healthcareResult,
      schoolResult,
      internetResult,
    ] = await Promise.all([
      this.traffic.fetchTraffic({
        latitude: lat,
        longitude: lon,
        cityLatitude: cityLat,
        cityLongitude: cityLon,
      }),
      this.crime.fetchCrimeStats({ district, state }),
      this.healthcare.fetchHealthcareStats({ district, state }),
      this.schools.fetchSchoolStats({ district, state }),
      this.internet.fetchInternetStats({ district, state }),
    ]);

    if (trafficResult?.avgCommuteMinutes !== undefined) {
      rows.push({
        statKey: 'avg_commute_min',
        value: trafficResult.avgCommuteMinutes,
        source: this.traffic.activeProviderName(),
      });
    }
    if (trafficResult?.congestionIndex !== undefined) {
      rows.push({
        statKey: 'congestion_index',
        value: trafficResult.congestionIndex,
        source: this.traffic.activeProviderName(),
      });
    }
    if (crimeResult?.crimeRatePer1000 !== undefined) {
      rows.push({
        statKey: 'crime_rate_per_1000',
        value: crimeResult.crimeRatePer1000,
        source: this.crime.activeProviderName(),
      });
    }
    if (healthcareResult?.bedsPerThousand !== undefined) {
      rows.push({
        statKey: 'beds_per_thousand',
        value: healthcareResult.bedsPerThousand,
        source: this.healthcare.activeProviderName(),
      });
    }
    if (schoolResult?.pupilTeacherRatio !== undefined) {
      rows.push({
        statKey: 'pupil_teacher_ratio',
        value: schoolResult.pupilTeacherRatio,
        source: this.schools.activeProviderName(),
      });
    }
    if (internetResult?.avgDownloadMbps !== undefined) {
      rows.push({
        statKey: 'avg_download_mbps',
        value: internetResult.avgDownloadMbps,
        source: this.internet.activeProviderName(),
      });
    }
    if (internetResult?.broadbandPenetrationPct !== undefined) {
      rows.push({
        statKey: 'broadband_penetration_pct',
        value: internetResult.broadbandPenetrationPct,
        source: this.internet.activeProviderName(),
      });
    }

    for (const row of rows) {
      await this.prisma.areaStatistic.upsert({
        where: {
          areaId_statKey_asOfDate: { areaId, statKey: row.statKey, asOfDate },
        },
        create: {
          areaId,
          statKey: row.statKey,
          value: row.value,
          source: row.source,
          asOfDate,
        },
        update: { value: row.value, source: row.source },
      });
    }

    return rows.length;
  }
}
