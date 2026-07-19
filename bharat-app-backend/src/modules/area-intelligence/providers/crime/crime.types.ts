export interface CrimeQuery {
  district: string;
  state: string;
}

export interface CrimeResult {
  crimeRatePer1000?: number;
}

/** Mirrors LocationDataProvider in shape. */
export interface CrimeProvider {
  readonly name: string;
  isConfigured(): boolean;
  fetchCrimeStats(query: CrimeQuery): Promise<CrimeResult | null>;
}
