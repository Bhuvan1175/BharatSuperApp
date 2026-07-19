import { Injectable, Logger } from '@nestjs/common';
import { CrimeProvider, CrimeQuery, CrimeResult } from './crime.types';

/**
 * data.gov.in / NCRB-style district crime datasets. Per docs §8, Crime has NO
 * fallback — if this isn't configured, the SAFETY category's crime input
 * surfaces as unavailable ("insufficient data"), not a fabricated number.
 *
 * DATA_GOV_IN_CRIME_RESOURCE_ID must be set to a real NCRB/data.gov.in
 * resource id for this provider to activate (none is hardcoded — unlike the
 * pincode directory, no single NCRB resource id is stable/free across
 * districts, so an operator supplies the one they've vetted).
 */
@Injectable()
export class GovtCrimeProvider implements CrimeProvider {
  readonly name = 'govt-crime';
  private readonly logger = new Logger(GovtCrimeProvider.name);

  private get apiKey(): string | undefined {
    return process.env.DATA_GOV_IN_API_KEY;
  }
  private get resourceId(): string | undefined {
    return process.env.DATA_GOV_IN_CRIME_RESOURCE_ID;
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.resourceId;
  }

  async fetchCrimeStats(query: CrimeQuery): Promise<CrimeResult | null> {
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
        this.logger.warn(`data.gov.in crime dataset returned ${res.status}`);
        return null;
      }
      const json = (await res.json()) as {
        records?: Array<Record<string, unknown>>;
      };
      const record = json.records?.[0];
      if (!record) return null;
      const rate = Number(record.crime_rate ?? record.crimeRate);
      return Number.isFinite(rate) ? { crimeRatePer1000: rate } : null;
    } catch (e) {
      this.logger.warn(`Crime dataset request failed: ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
