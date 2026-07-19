import { Injectable, Logger } from '@nestjs/common';
import { AmenityCategory } from '@prisma/client';
import {
  NearbyPlaceQuery,
  NearbyPlaceResult,
  NearbyPlacesProvider,
} from './nearby-places.types';

/** One OSM tag filter (`key`/`value`) per {@link AmenityCategory}. */
const OSM_TAG_BY_CATEGORY: Record<
  AmenityCategory,
  { key: string; value: string }
> = {
  HOSPITAL: { key: 'amenity', value: 'hospital' },
  SCHOOL: { key: 'amenity', value: 'school' },
  POLICE: { key: 'amenity', value: 'police' },
  PARK: { key: 'leisure', value: 'park' },
  MARKET: { key: 'shop', value: 'supermarket' },
  ATM: { key: 'amenity', value: 'atm' },
  BUS_STOP: { key: 'highway', value: 'bus_stop' },
  METRO: { key: 'station', value: 'subway' },
};

/**
 * OpenStreetMap (Overpass API) — free, no key required. Used as the fallback
 * behind Google Places, and the only source when GOOGLE_PLACES_API_KEY isn't
 * set (mirrors GovtLocationProvider's role as the free, always-available
 * option in src/location/providers).
 */
@Injectable()
export class OsmPlacesProvider implements NearbyPlacesProvider {
  readonly name = 'osm';
  private readonly logger = new Logger(OsmPlacesProvider.name);

  private get endpoint(): string {
    return (
      process.env.OSM_OVERPASS_URL || 'https://overpass-api.de/api/interpreter'
    );
  }

  isConfigured(): boolean {
    return process.env.OSM_OVERPASS_DISABLED !== 'true';
  }

  /**
   * The free public Overpass instance is noticeably flaky under load — a
   * larger-radius query (e.g. HOSPITAL's 5km) can time out or 5xx while a
   * smaller one (ATM's 2km) succeeds moments later for the same area. A
   * failed attempt is retried with backoff; a genuinely empty result (valid
   * response, zero matches) is NOT retried and returns [] immediately.
   *
   * `429` is handled differently on purpose: it means Overpass has already
   * decided we're over quota, and retrying into a live rate limit just
   * extends it. So a 429 is not retried at all here — it logs and returns
   * [] immediately, leaving it to the next manual/scheduled refresh (once
   * the window has passed) rather than making the block worse.
   */
  async fetchNearby(query: NearbyPlaceQuery): Promise<NearbyPlaceResult[]> {
    if (!this.isConfigured()) return [];
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const outcome = await this.attemptFetch(query);
      if (outcome.rateLimited) {
        this.logger.warn(
          `Overpass rate-limited us for ${query.category} — skipping until a later refresh`,
        );
        return [];
      }
      if (outcome.result !== null) return outcome.result;
      if (attempt < maxAttempts) {
        await this.sleep(2000 * attempt);
      }
    }
    this.logger.warn(
      `Overpass gave up after ${maxAttempts} attempts for ${query.category}`,
    );
    return [];
  }

  /** One attempt. `result: null` (with `rateLimited: false`) means a transient
   * failure the caller may retry; `rateLimited: true` means stop entirely. */
  private async attemptFetch(
    query: NearbyPlaceQuery,
  ): Promise<{ result: NearbyPlaceResult[] | null; rateLimited: boolean }> {
    const tag = OSM_TAG_BY_CATEGORY[query.category];
    const around = `around:${query.radiusMeters},${query.latitude},${query.longitude}`;
    const ql = `[out:json][timeout:15];(
      node["${tag.key}"="${tag.value}"](${around});
      way["${tag.key}"="${tag.value}"](${around});
    );out center 50;`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          // Overpass rejects requests with no User-Agent (406) — Node's fetch,
          // unlike curl, sends none by default, so this must be set explicitly.
          'User-Agent':
            process.env.OSM_OVERPASS_USER_AGENT ||
            'BharatSuperApp-AreaIntelligence/1.0',
        },
        body: ql,
        signal: controller.signal,
      });
      if (res.status === 429) {
        return { result: null, rateLimited: true };
      }
      if (!res.ok) {
        this.logger.warn(`Overpass API returned ${res.status}`);
        return { result: null, rateLimited: false };
      }
      const json = (await res.json()) as {
        elements?: Array<{
          type: string;
          id: number;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: Record<string, string>;
        }>;
      };
      const elements = json.elements ?? [];
      const result = elements
        .map((el): NearbyPlaceResult | null => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (lat === undefined || lon === undefined) return null;
          return {
            externalPlaceId: `osm:${el.type}/${el.id}`,
            name: el.tags?.name || `${tag.value} (unnamed)`,
            category: query.category,
            latitude: lat,
            longitude: lon,
          };
        })
        .filter((r): r is NearbyPlaceResult => r !== null);
      return { result, rateLimited: false };
    } catch (e) {
      this.logger.warn(`Overpass request failed: ${(e as Error).message}`);
      return { result: null, rateLimited: false };
    } finally {
      clearTimeout(timer);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
