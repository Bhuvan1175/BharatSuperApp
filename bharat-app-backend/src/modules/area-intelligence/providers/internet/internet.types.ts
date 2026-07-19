export interface InternetQuery {
  district: string;
  state: string;
}

export interface InternetResult {
  avgDownloadMbps?: number;
  broadbandPenetrationPct?: number;
}

/** Mirrors LocationDataProvider in shape. */
export interface InternetProvider {
  readonly name: string;
  isConfigured(): boolean;
  fetchInternetStats(query: InternetQuery): Promise<InternetResult | null>;
}
