import { Injectable, Logger } from '@nestjs/common';
import {
  SchoolStatsProvider,
  SchoolStatsQuery,
  SchoolStatsResult,
} from './schools.types';

/**
 * data.gov.in UDISE+ school datasets (pupil-teacher ratio by district). Per
 * docs §8, fallback for Schools is Google Places school density — already
 * covered by NearbyAmenity/AreaNearbyAmenity counts feeding the SCHOOL
 * scorer directly; this provider only supplies `pupilTeacherRatio`.
 */
@Injectable()
export class GovtSchoolProvider implements SchoolStatsProvider {
  readonly name = 'govt-school';
  private readonly logger = new Logger(GovtSchoolProvider.name);

  private get apiKey(): string | undefined {
    return process.env.DATA_GOV_IN_API_KEY;
  }
  private get resourceId(): string | undefined {
    return process.env.DATA_GOV_IN_UDISE_RESOURCE_ID;
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.resourceId;
  }

  async fetchSchoolStats(
    query: SchoolStatsQuery,
  ): Promise<SchoolStatsResult | null> {
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
        this.logger.warn(`data.gov.in UDISE+ dataset returned ${res.status}`);
        return null;
      }
      const json = (await res.json()) as {
        records?: Array<Record<string, unknown>>;
      };
      const record = json.records?.[0];
      if (!record) return null;
      const ratio = Number(
        record.pupil_teacher_ratio ?? record.pupilTeacherRatio,
      );
      return Number.isFinite(ratio) ? { pupilTeacherRatio: ratio } : null;
    } catch (e) {
      this.logger.warn(
        `UDISE+ dataset request failed: ${(e as Error).message}`,
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
