export interface TrafficQuery {
  latitude: number;
  longitude: number;
  /** Nearest city center, for a commute-time estimate. */
  cityLatitude: number;
  cityLongitude: number;
}

export interface TrafficResult {
  avgCommuteMinutes?: number;
  /** 0-100, higher = worse. */
  congestionIndex?: number;
}

/** Mirrors LocationDataProvider in shape: `name` + `isConfigured()` + one fetch. */
export interface TrafficProvider {
  readonly name: string;
  isConfigured(): boolean;
  fetchTraffic(query: TrafficQuery): Promise<TrafficResult | null>;
}
