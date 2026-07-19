import { Injectable, Logger } from '@nestjs/common';
import {
  HealthcareProvider,
  HealthcareQuery,
  HealthcareResult,
} from './healthcare.types';

/**
 * data.gov.in health facility datasets (bed capacity by district). Per docs
 * §8, the fallback for Healthcare is Google Places hospital density — already
 * covered by NearbyAmenity/AreaNearbyAmenity counts feeding the HEALTHCARE
 * scorer directly, so this provider only needs to supply `bedsPerThousand`
 * when a real resource id is configured.
 */
@Injectable()
export class GovtHealthcareProvider implements HealthcareProvider {
  readonly name = 'govt-healthcare';
  private readonly logger = new Logger(GovtHealthcareProvider.name);

  private get apiKey(): string | undefined {
    return process.env.DATA_GOV_IN_API_KEY;
  }
  private get resourceId(): string | undefined {
    return process.env.DATA_GOV_IN_HEALTH_RESOURCE_ID;
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.resourceId;
  }

  async fetchHealthcareStats(
    query: HealthcareQuery,
  ): Promise<HealthcareResult | null> {
    if (!this.apiKey || !this.resourceId) return null;
    const url =
      `https://api.data.gov.in/resource/${this.resourceId}` +
      `?api-key=${encodeURIComponent(this.apiKey)}&format=json&limit=5` +
      `&filters[district]=${encodeURIComponent(query.district)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        this.logger.warn(`data.gov.in health dataset returned ${res.status}`);
        return null;
      }
      const json = (await res.json()) as {
        records?: Array<Record<string, unknown>>;
      };
      const record = json.records?.[0];
      if (!record) return null;
      const beds = Number(record.beds_per_thousand ?? record.bedsPerThousand);
      return Number.isFinite(beds) ? { bedsPerThousand: beds } : null;
    } catch (e) {
      this.logger.warn(
        `Health dataset request failed: ${(e as Error).message}`,
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
