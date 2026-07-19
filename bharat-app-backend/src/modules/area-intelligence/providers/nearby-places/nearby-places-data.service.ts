import { Injectable } from '@nestjs/common';
import { GooglePlacesProvider } from './google-places.provider';
import { OsmPlacesProvider } from './osm-places.provider';
import {
  NearbyPlaceQuery,
  NearbyPlaceResult,
  NearbyPlacesProvider,
} from './nearby-places.types';

/**
 * Ordered-fallback aggregator for nearby places — mirrors
 * LocationDataService (src/location/providers/location-data.service.ts)
 * exactly: NEARBY_PLACES_PROVIDER env var picks the preference order, each
 * configured provider is tried in turn, first non-empty result wins.
 */
@Injectable()
export class NearbyPlacesDataService {
  constructor(
    private readonly google: GooglePlacesProvider,
    private readonly osm: OsmPlacesProvider,
  ) {}

  private ordered(): NearbyPlacesProvider[] {
    const pref = (process.env.NEARBY_PLACES_PROVIDER || 'auto').toLowerCase();
    const base: NearbyPlacesProvider[] =
      pref === 'osm' ? [this.osm, this.google] : [this.google, this.osm];
    return base.filter((p) => p.isConfigured());
  }

  activeProviderName(): string {
    return this.ordered()[0]?.name ?? 'none';
  }

  isConfigured(): boolean {
    return this.ordered().length > 0;
  }

  async fetchNearby(query: NearbyPlaceQuery): Promise<NearbyPlaceResult[]> {
    for (const provider of this.ordered()) {
      const result = await provider.fetchNearby(query);
      if (result.length) return result;
    }
    return [];
  }
}
