import {apiClient} from './client';

/** Mirrors the backend's Prisma enums (`@prisma/client`) 1:1. */
export type AreaScoreCategory =
  | 'SAFETY'
  | 'TRAFFIC'
  | 'HEALTHCARE'
  | 'SCHOOL'
  | 'INTERNET'
  | 'UTILITIES';

export type AmenityCategory =
  | 'HOSPITAL'
  | 'SCHOOL'
  | 'POLICE'
  | 'PARK'
  | 'MARKET'
  | 'ATM'
  | 'BUS_STOP'
  | 'METRO';

export type DataSourceCategory =
  | 'GOVT'
  | 'MAPS'
  | 'TRAFFIC'
  | 'HEALTHCARE'
  | 'SCHOOL'
  | 'CRIME'
  | 'INTERNET'
  | 'WEATHER';

export type BackgroundJobType =
  | 'AREA_MASTER_SYNC'
  | 'NEARBY_REFRESH'
  | 'TRAFFIC_UPDATE'
  | 'INTERNET_UPDATE'
  | 'SCORE_RECALC'
  | 'PROPERTY_STATS_UPDATE'
  | 'BUILDER_RATING_UPDATE'
  | 'HISTORY_CLEANUP';

export type JobStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';

export interface AreaScoreSummary {
  overallScore: number | null;
  confidence: number | null;
  computedAt: string;
}

export interface AreaCity {
  id: string;
  name: string;
}

export interface AreaLocality {
  id: string;
  name: string;
  city: AreaCity;
}

export interface AreaListItem {
  id: string;
  localityId: string;
  administrativeCode: string | null;
  population: number | null;
  populationYear: number | null;
  locality: AreaLocality;
  scoreSnapshot: AreaScoreSummary | null;
  /** Present only when returned from a lat/long geo search. */
  distanceMeters?: number;
}

export interface AreaListResponse {
  items: AreaListItem[];
  nextCursor: string | null;
}

export interface AreaDetail {
  id: string;
  localityId: string;
  administrativeCode: string | null;
  population: number | null;
  populationYear: number | null;
  source: 'GOVT' | 'MANUAL' | 'DERIVED';
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'STALE';
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  locality: AreaLocality & {
    latitude: number | null;
    longitude: number | null;
    city: AreaCity & {
      district?: {id: string; name: string; state?: {id: string; name: string}};
    };
  };
  scoreSnapshot: {
    id: string;
    overallScore: number | null;
    confidence: number | null;
    algoVersion: string;
    computedAt: string;
  } | null;
}

export interface AreaCategoryScoreItem {
  id: string;
  areaId: string;
  category: AreaScoreCategory;
  score: number | null;
  confidence: number | null;
  weight: number;
  computedAt: string;
}

export interface AreaIntelligence {
  id: string;
  areaId: string;
  overallScore: number | null;
  confidence: number | null;
  algoVersion: string;
  computedAt: string;
  categories: AreaCategoryScoreItem[];
}

export interface NearbyAmenityItem {
  areaId: string;
  amenityId: string;
  distanceMeters: number;
  walkTimeMin: number | null;
  amenity: {
    id: string;
    category: AmenityCategory;
    name: string;
    latitude: number;
    longitude: number;
    rating: number | null;
  };
}

export interface PriceHistoryPoint {
  id: string;
  areaId: string;
  period: string;
  avgPrice: number;
  pricePerSqft: number | null;
  sampleSize: number;
}

export interface BuilderRatingItem {
  id: string;
  areaId: string;
  builderName: string;
  rating: number | null;
  reviewCount: number;
  source: string;
}

export interface PropertyStats {
  id: string;
  areaId: string;
  avgPrice: number | null;
  pricePerSqft: number | null;
  listingCount: number;
  demandIndex: number | null;
  computedAt: string;
}

export interface AreaPropertyStatsResponse {
  stats: PropertyStats | null;
  priceHistory: PriceHistoryPoint[];
  builderRatings: BuilderRatingItem[];
}

export interface AreaHistoryPoint {
  id: string;
  areaId: string;
  snapshotAt: string;
  overallScore: number | null;
  categoryScores: Partial<Record<AreaScoreCategory, number>>;
  statsSnapshot: Record<string, unknown>;
}

export interface AreaInsight {
  id: string;
  areaId: string;
  summary: string;
  pros: string[];
  cons: string[];
  recommendations: string[];
  confidence: number | null;
  modelVersion: string;
  promptVersion: string;
  generatedAt: string;
  isCurrent: boolean;
}

export interface SavedAreaItem {
  userId: string;
  areaId: string;
  createdAt: string;
  area: AreaListItem;
}

export interface AreaCompareResult {
  id: string;
  name: string;
  city: string;
  overallScore: number | null;
  confidence: number | null;
  categoryScores: Partial<Record<AreaScoreCategory, number | null>>;
}

export interface AreaListFilters {
  cityId?: string;
  cursor?: string;
  limit?: number;
}

export interface AreaSearchFilters {
  q?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  limit?: number;
}

export interface AreaHistoryFilters {
  from?: string;
  to?: string;
}

export interface BackgroundJobLogItem {
  id: string;
  jobType: BackgroundJobType;
  areaId: string | null;
  status: JobStatus;
  recordsProcessed: number | null;
  errorMessage: string | null;
  triggeredById: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface ExternalDataSourceItem {
  id: string;
  providerKey: string;
  category: DataSourceCategory;
  displayName: string;
  isActive: boolean;
  priority: number;
  rateLimitPerMin: number | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
}

export interface AdminJobFilters {
  jobType?: BackgroundJobType;
  status?: JobStatus;
  limit?: number;
}

export interface UpdateDataSourceBody {
  isActive?: boolean;
  priority?: number;
}

/**
 * Citizen-facing Area Query API. Routes are URI-versioned on the backend
 * (`@Controller({path: 'areas', version: '1'})`), unlike every other existing
 * `*.api.ts` file here — so every call below is explicitly prefixed `/v1`.
 */
export const areaIntelligenceApi = {
  list: async (filters?: AreaListFilters): Promise<AreaListResponse> =>
    (await apiClient.get<AreaListResponse>('/v1/areas', {params: filters}))
      .data,

  search: async (filters?: AreaSearchFilters): Promise<AreaListItem[]> =>
    (await apiClient.get<AreaListItem[]>('/v1/areas/search', {params: filters}))
      .data,

  mySavedAreas: async (): Promise<SavedAreaItem[]> =>
    (await apiClient.get<SavedAreaItem[]>('/v1/areas/saved/mine')).data,

  save: async (
    areaId: string,
  ): Promise<{userId: string; areaId: string; createdAt: string}> =>
    (await apiClient.post('/v1/areas/save', {areaId})).data,

  unsave: async (
    areaId: string,
  ): Promise<{success: boolean; message: string}> =>
    (await apiClient.delete(`/v1/areas/save/${areaId}`)).data,

  compare: async (areaIds: string[]): Promise<AreaCompareResult[]> =>
    (await apiClient.post<AreaCompareResult[]>('/v1/areas/compare', {areaIds}))
      .data,

  getDetail: async (id: string): Promise<AreaDetail> =>
    (await apiClient.get<AreaDetail>(`/v1/areas/${id}`)).data,

  getIntelligence: async (id: string): Promise<AreaIntelligence> =>
    (await apiClient.get<AreaIntelligence>(`/v1/areas/${id}/intelligence`))
      .data,

  getNearby: async (
    id: string,
    category?: AmenityCategory,
  ): Promise<NearbyAmenityItem[]> =>
    (
      await apiClient.get<NearbyAmenityItem[]>(`/v1/areas/${id}/nearby`, {
        params: {category},
      })
    ).data,

  getPropertyStats: async (id: string): Promise<AreaPropertyStatsResponse> =>
    (
      await apiClient.get<AreaPropertyStatsResponse>(
        `/v1/areas/${id}/property-stats`,
      )
    ).data,

  getHistory: async (
    id: string,
    filters?: AreaHistoryFilters,
  ): Promise<AreaHistoryPoint[]> =>
    (
      await apiClient.get<AreaHistoryPoint[]>(`/v1/areas/${id}/history`, {
        params: filters,
      })
    ).data,

  getSummary: async (id: string): Promise<AreaInsight> =>
    (await apiClient.get<AreaInsight>(`/v1/areas/${id}/summary`)).data,
};

/**
 * AREA_MANAGER admin surface (`/v1/admin/areas`). Every mutation enqueues a
 * background job on the backend and returns immediately with a jobId — there
 * is no synchronous "recompute now" response to show.
 */
export const areaAdminApi = {
  sync: async (): Promise<{jobId: string | number}> =>
    (await apiClient.post('/v1/admin/areas/sync')).data,

  refresh: async (
    areaId?: string,
  ): Promise<{nearbyJobId: string | number; statsJobId: string | number}> =>
    (await apiClient.post('/v1/admin/areas/refresh', {areaId})).data,

  recalculate: async (areaId?: string): Promise<{jobId: string | number}> =>
    (await apiClient.post('/v1/admin/areas/recalculate', {areaId})).data,

  listJobs: async (
    filters?: AdminJobFilters,
  ): Promise<BackgroundJobLogItem[]> =>
    (
      await apiClient.get<BackgroundJobLogItem[]>('/v1/admin/areas/jobs', {
        params: filters,
      })
    ).data,

  listDataSources: async (): Promise<ExternalDataSourceItem[]> =>
    (
      await apiClient.get<ExternalDataSourceItem[]>(
        '/v1/admin/areas/data-sources',
      )
    ).data,

  updateDataSource: async (
    id: string,
    body: UpdateDataSourceBody,
  ): Promise<ExternalDataSourceItem> =>
    (
      await apiClient.patch<ExternalDataSourceItem>(
        `/v1/admin/areas/data-sources/${id}`,
        body,
      )
    ).data,
};
