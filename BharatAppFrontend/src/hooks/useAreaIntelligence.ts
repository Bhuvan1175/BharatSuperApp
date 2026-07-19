import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  AdminJobFilters,
  AmenityCategory,
  AreaHistoryFilters,
  AreaListFilters,
  AreaSearchFilters,
  UpdateDataSourceBody,
  areaAdminApi,
  areaIntelligenceApi,
} from '../api/areaIntelligence.api';

export const AREA_KEYS = {
  list: (filters?: AreaListFilters) =>
    ['areaIntelligence', 'list', filters ?? {}] as const,
  search: (filters?: AreaSearchFilters) =>
    ['areaIntelligence', 'search', filters ?? {}] as const,
  saved: ['areaIntelligence', 'saved'] as const,
  compare: (areaIds: string[]) =>
    ['areaIntelligence', 'compare', [...areaIds].sort()] as const,
  detail: (id: string) => ['areaIntelligence', 'detail', id] as const,
  intelligence: (id: string) =>
    ['areaIntelligence', 'intelligence', id] as const,
  nearby: (id: string, category?: AmenityCategory) =>
    ['areaIntelligence', 'nearby', id, category ?? null] as const,
  propertyStats: (id: string) =>
    ['areaIntelligence', 'property-stats', id] as const,
  history: (id: string, filters?: AreaHistoryFilters) =>
    ['areaIntelligence', 'history', id, filters ?? {}] as const,
  summary: (id: string) => ['areaIntelligence', 'summary', id] as const,
  adminJobs: (filters?: AdminJobFilters) =>
    ['areaIntelligence', 'admin', 'jobs', filters ?? {}] as const,
  adminDataSources: ['areaIntelligence', 'admin', 'data-sources'] as const,
};

const invalidateSaved = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({queryKey: AREA_KEYS.saved});

/* ---------------------------------------------------------------------- */
/* Citizen: browse / search / save                                        */
/* ---------------------------------------------------------------------- */

export const useAreas = (filters?: AreaListFilters) =>
  useQuery({
    queryKey: AREA_KEYS.list(filters),
    queryFn: () => areaIntelligenceApi.list(filters),
    placeholderData: keepPreviousData,
  });

/** Text (name/pincode) or geo search — pass an already-debounced `filters`. */
export const useAreaSearch = (filters?: AreaSearchFilters) => {
  const hasQuery =
    !!filters?.q?.trim() ||
    !!filters?.pincode?.trim() ||
    (filters?.latitude !== undefined && filters?.longitude !== undefined);
  return useQuery({
    queryKey: AREA_KEYS.search(filters),
    queryFn: () => areaIntelligenceApi.search(filters),
    enabled: hasQuery,
    placeholderData: keepPreviousData,
  });
};

export const useSavedAreas = () =>
  useQuery({
    queryKey: AREA_KEYS.saved,
    queryFn: () => areaIntelligenceApi.mySavedAreas(),
  });

export const useSaveArea = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (areaId: string) => areaIntelligenceApi.save(areaId),
    onSuccess: () => invalidateSaved(qc),
  });
};

export const useUnsaveArea = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (areaId: string) => areaIntelligenceApi.unsave(areaId),
    onSuccess: () => invalidateSaved(qc),
  });
};

/** Side-by-side comparison of 2–4 areas (stateless on the backend). */
export const useCompareAreas = (areaIds: string[]) =>
  useQuery({
    queryKey: AREA_KEYS.compare(areaIds),
    queryFn: () => areaIntelligenceApi.compare(areaIds),
    enabled: areaIds.length >= 2 && areaIds.length <= 4,
  });

/* ---------------------------------------------------------------------- */
/* Citizen: single-area detail                                             */
/* ---------------------------------------------------------------------- */

export const useAreaDetail = (id?: string) =>
  useQuery({
    queryKey: AREA_KEYS.detail(id ?? ''),
    queryFn: () => areaIntelligenceApi.getDetail(id as string),
    enabled: !!id,
  });

export const useAreaIntelligenceDetail = (id?: string) =>
  useQuery({
    queryKey: AREA_KEYS.intelligence(id ?? ''),
    queryFn: () => areaIntelligenceApi.getIntelligence(id as string),
    enabled: !!id,
    retry: false, // 404s until a score has been computed for the area
  });

export const useAreaNearby = (id?: string, category?: AmenityCategory) =>
  useQuery({
    queryKey: AREA_KEYS.nearby(id ?? '', category),
    queryFn: () => areaIntelligenceApi.getNearby(id as string, category),
    enabled: !!id,
  });

export const useAreaPropertyStats = (id?: string) =>
  useQuery({
    queryKey: AREA_KEYS.propertyStats(id ?? ''),
    queryFn: () => areaIntelligenceApi.getPropertyStats(id as string),
    enabled: !!id,
  });

export const useAreaHistory = (id?: string, filters?: AreaHistoryFilters) =>
  useQuery({
    queryKey: AREA_KEYS.history(id ?? '', filters),
    queryFn: () => areaIntelligenceApi.getHistory(id as string, filters),
    enabled: !!id,
  });

export const useAreaSummary = (id?: string) =>
  useQuery({
    queryKey: AREA_KEYS.summary(id ?? ''),
    queryFn: () => areaIntelligenceApi.getSummary(id as string),
    enabled: !!id,
    retry: false, // 404s until an AI summary has been generated for the area
  });

/* ---------------------------------------------------------------------- */
/* AREA_MANAGER admin surface                                              */
/* ---------------------------------------------------------------------- */

export const useAreaAdminJobs = (filters?: AdminJobFilters) =>
  useQuery({
    queryKey: AREA_KEYS.adminJobs(filters),
    queryFn: () => areaAdminApi.listJobs(filters),
  });

export const useAreaDataSources = () =>
  useQuery({
    queryKey: AREA_KEYS.adminDataSources,
    queryFn: () => areaAdminApi.listDataSources(),
  });

export const useUpdateAreaDataSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, body}: {id: string; body: UpdateDataSourceBody}) =>
      areaAdminApi.updateDataSource(id, body),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: AREA_KEYS.adminDataSources}),
  });
};

/** Enqueues the weekly Area Master sync job; refetch jobs afterwards to see it appear. */
export const useSyncAreaMaster = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => areaAdminApi.sync(),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: ['areaIntelligence', 'admin', 'jobs']}),
  });
};

/** Enqueues nearby + traffic refresh jobs for one area (or every area when omitted). */
export const useRefreshArea = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (areaId?: string) => areaAdminApi.refresh(areaId),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: ['areaIntelligence', 'admin', 'jobs']}),
  });
};

/** Enqueues a score recalculation job for one area (or every area when omitted). */
export const useRecalculateArea = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (areaId?: string) => areaAdminApi.recalculate(areaId),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: ['areaIntelligence', 'admin', 'jobs']}),
  });
};
