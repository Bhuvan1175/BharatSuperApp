import { Injectable } from '@nestjs/common';
import { TraiInternetProvider } from './trai-internet.provider';
import {
  InternetProvider,
  InternetQuery,
  InternetResult,
} from './internet.types';

@Injectable()
export class InternetDataService {
  constructor(private readonly trai: TraiInternetProvider) {}

  private ordered(): InternetProvider[] {
    return [this.trai].filter((p) => p.isConfigured());
  }

  activeProviderName(): string {
    return this.ordered()[0]?.name ?? 'none';
  }

  isConfigured(): boolean {
    return this.ordered().length > 0;
  }

  async fetchInternetStats(
    query: InternetQuery,
  ): Promise<InternetResult | null> {
    for (const provider of this.ordered()) {
      const result = await provider.fetchInternetStats(query);
      if (result) return result;
    }
    return null;
  }
}
