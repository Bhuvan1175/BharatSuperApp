import { Injectable } from '@nestjs/common';
import {
  CityContext,
  DistrictContext,
  LocationDataProvider,
  VillageResult,
  WardResult,
} from './location-data.types';
import { OpenAiLocationProvider } from './openai-location.provider';
import { GovtLocationProvider } from './govt-location.provider';

/**
 * Chooses and delegates to the active location-data provider(s), with fallback.
 *
 * LOCATION_DATA_PROVIDER env var sets the preference order:
 *   - "govt"   → try government data first, then OpenAI
 *   - "openai" → try OpenAI first, then government data
 *   - "auto" (default) → government data first (free + authoritative), then OpenAI
 *
 * For each request the configured providers are tried in order and the first
 * NON-EMPTY result wins. This means, e.g., villages can come from the free
 * data.gov.in source while wards (which govt data doesn't expose) fall through
 * to OpenAI when an OpenAI key is also set — otherwise wards are entered
 * manually. If nothing is configured, isConfigured() is false and auto-fetch is
 * skipped everywhere (manual entry always still works).
 */
@Injectable()
export class LocationDataService {
  constructor(
    private readonly openai: OpenAiLocationProvider,
    private readonly govt: GovtLocationProvider,
  ) {}

  /** Configured providers, in the preferred order. */
  private ordered(): LocationDataProvider[] {
    const pref = (process.env.LOCATION_DATA_PROVIDER || 'auto').toLowerCase();
    const base: LocationDataProvider[] =
      pref === 'openai'
        ? [this.openai, this.govt]
        : [this.govt, this.openai]; // "govt" and "auto" → govt first
    return base.filter((p) => p.isConfigured());
  }

  /** The provider that data is primarily attributed to (row `source`). */
  activeProviderName(): string {
    return this.ordered()[0]?.name ?? 'none';
  }

  /** True when at least one provider can answer (villages). */
  isConfigured(): boolean {
    return this.ordered().length > 0;
  }

  /**
   * True when wards can be auto-fetched. Government data has no ward directory,
   * so only an OpenAI key enables ward auto-fill; otherwise wards are manual.
   */
  wardsAutoAvailable(): boolean {
    return this.openai.isConfigured();
  }

  async fetchVillages(ctx: DistrictContext): Promise<VillageResult[]> {
    for (const provider of this.ordered()) {
      const result = await provider.fetchVillages(ctx);
      if (result.length) return result;
    }
    return [];
  }

  async fetchWards(ctx: CityContext): Promise<WardResult[]> {
    for (const provider of this.ordered()) {
      const result = await provider.fetchWards(ctx);
      if (result.length) return result;
    }
    return [];
  }

  /**
   * Resolve a PIN code to coordinates via the government pincode directory.
   * Govt-only — OpenAI has no equivalent lookup — so this bypasses the
   * provider-preference ordering used for villages/wards. The locality/city
   * name (when given) disambiguates a PIN code that covers several post
   * offices with different coordinates.
   */
  geocodePincode(
    pincode: string,
    context?: { localityName?: string; cityName?: string },
  ): Promise<{ latitude: number; longitude: number } | null> {
    return this.govt.fetchCoordinatesByPincode(pincode, context);
  }
}
