export interface HealthcareQuery {
  district: string;
  state: string;
}

export interface HealthcareResult {
  bedsPerThousand?: number;
}

/** Mirrors LocationDataProvider in shape. */
export interface HealthcareProvider {
  readonly name: string;
  isConfigured(): boolean;
  fetchHealthcareStats(
    query: HealthcareQuery,
  ): Promise<HealthcareResult | null>;
}
