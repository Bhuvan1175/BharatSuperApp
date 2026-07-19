import { AmenityCategory } from '@prisma/client';

export interface NearbyPlaceQuery {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  category: AmenityCategory;
}

export interface NearbyPlaceResult {
  /** Dedupe key from the provider (Google Place ID / OSM `type/id`). */
  externalPlaceId: string;
  name: string;
  category: AmenityCategory;
  latitude: number;
  longitude: number;
  rating?: number;
}

/**
 * Nearby-places provider contract — mirrors LocationDataProvider
 * (src/location/providers/location-data.types.ts) in shape: `name` +
 * `isConfigured()` + one fetch method, so providers are swappable without
 * touching the rest of the app.
 */
export interface NearbyPlacesProvider {
  readonly name: string;
  isConfigured(): boolean;
  fetchNearby(query: NearbyPlaceQuery): Promise<NearbyPlaceResult[]>;
}
