export interface SchoolStatsQuery {
  district: string;
  state: string;
}

export interface SchoolStatsResult {
  pupilTeacherRatio?: number;
}

/** Mirrors LocationDataProvider in shape. */
export interface SchoolStatsProvider {
  readonly name: string;
  isConfigured(): boolean;
  fetchSchoolStats(query: SchoolStatsQuery): Promise<SchoolStatsResult | null>;
}
