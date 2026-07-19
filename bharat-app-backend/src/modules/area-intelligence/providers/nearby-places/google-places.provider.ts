import { Injectable, Logger } from '@nestjs/common';
import { AmenityCategory } from '@prisma/client';
import {
  NearbyPlaceQuery,
  NearbyPlaceResult,
  NearbyPlacesProvider,
} from './nearby-places.types';

/** One Google Places "type" per {@link AmenityCategory}. */
const GOOGLE_TYPE_BY_CATEGORY: Record<AmenityCategory, string> = {
  HOSPITAL: 'hospital',
  SCHOOL: 'school',
  POLICE: 'police',
  PARK: 'park',
  MARKET: 'supermarket',
  ATM: 'atm',
  BUS_STOP: 'bus_station',
  METRO: 'subway_station',
};

/**
 * Google Places Nearby Search — the preferred (higher quality, includes
 * ratings) nearby-places source. Requires GOOGLE_PLACES_API_KEY; without it,
 * isConfigured() is false and NearbyPlacesDataService falls through to OSM.
 */
@Injectable()
export class GooglePlacesProvider implements NearbyPlacesProvider {
  readonly name = 'google-places';
  private readonly logger = new Logger(GooglePlacesProvider.name);

  private get apiKey(): string | undefined {
    return process.env.GOOGLE_PLACES_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async fetchNearby(query: NearbyPlaceQuery): Promise<NearbyPlaceResult[]> {
    if (!this.apiKey) return [];
    const type = GOOGLE_TYPE_BY_CATEGORY[query.category];
    const url =
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json' +
      `?location=${query.latitude},${query.longitude}` +
      `&radius=${query.radiusMeters}` +
      `&type=${encodeURIComponent(type)}` +
      `&key=${encodeURIComponent(this.apiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        this.logger.warn(`Google Places returned ${res.status}`);
        return [];
      }
      const json = (await res.json()) as {
        status: string;
        results?: Array<{
          place_id: string;
          name: string;
          rating?: number;
          geometry?: { location?: { lat: number; lng: number } };
        }>;
      };
      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        this.logger.warn(`Google Places status ${json.status}`);
        return [];
      }
      return (json.results ?? [])
        .filter((r) => r.geometry?.location)
        .map((r) => ({
          externalPlaceId: `google:${r.place_id}`,
          name: r.name,
          category: query.category,
          latitude: r.geometry!.location!.lat,
          longitude: r.geometry!.location!.lng,
          rating: r.rating,
        }));
    } catch (e) {
      this.logger.warn(`Google Places request failed: ${(e as Error).message}`);
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}
