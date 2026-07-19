import { Injectable, Logger } from '@nestjs/common';
import { TrafficProvider, TrafficQuery, TrafficResult } from './traffic.types';

/**
 * Google Distance Matrix (driving, `departure_time=now`) — `duration_in_traffic`
 * vs free-flow `duration` gives both a commute-time estimate and a congestion
 * proxy. Requires GOOGLE_MAPS_API_KEY; per docs §8, no fallback exists for
 * Traffic today — without a key, TrafficDataService returns null and the
 * TRAFFIC category surfaces "insufficient data".
 */
@Injectable()
export class GoogleTrafficProvider implements TrafficProvider {
  readonly name = 'google-traffic';
  private readonly logger = new Logger(GoogleTrafficProvider.name);

  private get apiKey(): string | undefined {
    return process.env.GOOGLE_MAPS_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async fetchTraffic(query: TrafficQuery): Promise<TrafficResult | null> {
    if (!this.apiKey) return null;
    const url =
      'https://maps.googleapis.com/maps/api/distancematrix/json' +
      `?origins=${query.latitude},${query.longitude}` +
      `&destinations=${query.cityLatitude},${query.cityLongitude}` +
      `&departure_time=now&key=${encodeURIComponent(this.apiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        this.logger.warn(`Distance Matrix returned ${res.status}`);
        return null;
      }
      const json = (await res.json()) as {
        status: string;
        rows?: Array<{
          elements: Array<{
            status: string;
            duration?: { value: number };
            duration_in_traffic?: { value: number };
          }>;
        }>;
      };
      const element = json.rows?.[0]?.elements?.[0];
      if (json.status !== 'OK' || !element || element.status !== 'OK')
        return null;

      const freeFlowSec = element.duration?.value;
      const trafficSec = element.duration_in_traffic?.value ?? freeFlowSec;
      if (trafficSec === undefined) return null;

      const avgCommuteMinutes = trafficSec / 60;
      const congestionIndex =
        freeFlowSec && freeFlowSec > 0
          ? Math.min(
              100,
              Math.max(0, ((trafficSec - freeFlowSec) / freeFlowSec) * 100),
            )
          : undefined;

      return { avgCommuteMinutes, congestionIndex };
    } catch (e) {
      this.logger.warn(
        `Distance Matrix request failed: ${(e as Error).message}`,
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
