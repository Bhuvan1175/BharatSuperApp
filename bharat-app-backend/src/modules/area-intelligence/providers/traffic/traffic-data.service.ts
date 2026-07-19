import { Injectable } from '@nestjs/common';
import { GoogleTrafficProvider } from './google-traffic.provider';
import { TrafficProvider, TrafficQuery, TrafficResult } from './traffic.types';

/** Single-provider today (no fallback exists for Traffic per docs §8), kept
 * as a data-service seam so a second provider can be added without touching
 * the collector. */
@Injectable()
export class TrafficDataService {
  constructor(private readonly google: GoogleTrafficProvider) {}

  private ordered(): TrafficProvider[] {
    return [this.google].filter((p) => p.isConfigured());
  }

  activeProviderName(): string {
    return this.ordered()[0]?.name ?? 'none';
  }

  isConfigured(): boolean {
    return this.ordered().length > 0;
  }

  async fetchTraffic(query: TrafficQuery): Promise<TrafficResult | null> {
    for (const provider of this.ordered()) {
      const result = await provider.fetchTraffic(query);
      if (result) return result;
    }
    return null;
  }
}
