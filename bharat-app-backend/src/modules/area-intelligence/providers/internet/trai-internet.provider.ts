import { Injectable, Logger } from '@nestjs/common';
import {
  InternetProvider,
  InternetQuery,
  InternetResult,
} from './internet.types';

/**
 * TRAI open data (via data.gov.in), broadband subscriber/speed datasets by
 * district. Per docs §8, no fallback exists for Internet — without a
 * resource id, the INTERNET category surfaces "insufficient data".
 */
@Injectable()
export class TraiInternetProvider implements InternetProvider {
  readonly name = 'trai';
  private readonly logger = new Logger(TraiInternetProvider.name);

  private get apiKey(): string | undefined {
    return process.env.DATA_GOV_IN_API_KEY;
  }
  private get resourceId(): string | undefined {
    return process.env.DATA_GOV_IN_TRAI_RESOURCE_ID;
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.resourceId;
  }

  async fetchInternetStats(
    query: InternetQuery,
  ): Promise<InternetResult | null> {
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
        this.logger.warn(`data.gov.in TRAI dataset returned ${res.status}`);
        return null;
      }
      const json = (await res.json()) as {
        records?: Array<Record<string, unknown>>;
      };
      const record = json.records?.[0];
      if (!record) return null;
      const speed = Number(record.avg_download_mbps ?? record.avgDownloadMbps);
      const penetration = Number(
        record.broadband_penetration_pct ?? record.broadbandPenetrationPct,
      );
      const result: InternetResult = {};
      if (Number.isFinite(speed)) result.avgDownloadMbps = speed;
      if (Number.isFinite(penetration))
        result.broadbandPenetrationPct = penetration;
      return Object.keys(result).length ? result : null;
    } catch (e) {
      this.logger.warn(`TRAI dataset request failed: ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
