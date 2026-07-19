import { Injectable } from '@nestjs/common';
import { GovtSchoolProvider } from './govt-school.provider';
import {
  SchoolStatsProvider,
  SchoolStatsQuery,
  SchoolStatsResult,
} from './schools.types';

@Injectable()
export class SchoolDataService {
  constructor(private readonly govt: GovtSchoolProvider) {}

  private ordered(): SchoolStatsProvider[] {
    return [this.govt].filter((p) => p.isConfigured());
  }

  activeProviderName(): string {
    return this.ordered()[0]?.name ?? 'none';
  }

  isConfigured(): boolean {
    return this.ordered().length > 0;
  }

  async fetchSchoolStats(
    query: SchoolStatsQuery,
  ): Promise<SchoolStatsResult | null> {
    for (const provider of this.ordered()) {
      const result = await provider.fetchSchoolStats(query);
      if (result) return result;
    }
    return null;
  }
}
