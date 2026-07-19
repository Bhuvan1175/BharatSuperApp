import { Injectable } from '@nestjs/common';
import { GovtCrimeProvider } from './govt-crime.provider';
import { CrimeProvider, CrimeQuery, CrimeResult } from './crime.types';

@Injectable()
export class CrimeDataService {
  constructor(private readonly govt: GovtCrimeProvider) {}

  private ordered(): CrimeProvider[] {
    return [this.govt].filter((p) => p.isConfigured());
  }

  activeProviderName(): string {
    return this.ordered()[0]?.name ?? 'none';
  }

  isConfigured(): boolean {
    return this.ordered().length > 0;
  }

  async fetchCrimeStats(query: CrimeQuery): Promise<CrimeResult | null> {
    for (const provider of this.ordered()) {
      const result = await provider.fetchCrimeStats(query);
      if (result) return result;
    }
    return null;
  }
}
