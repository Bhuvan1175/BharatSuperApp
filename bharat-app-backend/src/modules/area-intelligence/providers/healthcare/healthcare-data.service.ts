import { Injectable } from '@nestjs/common';
import { GovtHealthcareProvider } from './govt-healthcare.provider';
import {
  HealthcareProvider,
  HealthcareQuery,
  HealthcareResult,
} from './healthcare.types';

@Injectable()
export class HealthcareDataService {
  constructor(private readonly govt: GovtHealthcareProvider) {}

  private ordered(): HealthcareProvider[] {
    return [this.govt].filter((p) => p.isConfigured());
  }

  activeProviderName(): string {
    return this.ordered()[0]?.name ?? 'none';
  }

  isConfigured(): boolean {
    return this.ordered().length > 0;
  }

  async fetchHealthcareStats(
    query: HealthcareQuery,
  ): Promise<HealthcareResult | null> {
    for (const provider of this.ordered()) {
      const result = await provider.fetchHealthcareStats(query);
      if (result) return result;
    }
    return null;
  }
}
