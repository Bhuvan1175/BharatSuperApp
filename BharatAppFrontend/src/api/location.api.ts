import {apiClient} from './client';

export interface StateItem {
  id: string;
  name: string;
  _count?: {districts: number};
}

export interface District {
  id: string;
  name: string;
  stateId: string;
  citiesFetched?: boolean;
  _count?: {cities: number};
}

export interface City {
  id: string;
  name: string;
  districtId: string;
  source?: string;
  wardsFetched?: boolean;
  _count?: {localities: number; wards: number};
}

export interface Locality {
  id: string;
  name: string;
  cityId: string;
  pincode?: string | null;
}

export interface Ward {
  id: string;
  number: string;
  name: string;
  cityId: string;
  source?: string;
}

export interface SuggestResponse {
  source: 'openai' | 'none';
  suggestions: string[];
  message: string;
}

export interface MutationMessage {
  success: boolean;
  message: string;
}

export interface RefetchResponse {
  added: number;
  message: string;
}

export interface AiStatus {
  enabled: boolean;
  provider?: string;
  /** Whether wards can be auto-fetched (needs an OpenAI key; govt data has none). */
  wardsAuto?: boolean;
}

/** Location hierarchy: State → District → City → (Locality | Ward). */
export const locationApi = {
  aiStatus: async (): Promise<AiStatus> =>
    (await apiClient.get<AiStatus>('/locations/ai-status')).data,

  /* States */
  listStates: async (): Promise<StateItem[]> =>
    (await apiClient.get<StateItem[]>('/locations/states')).data,
  createState: async (name: string): Promise<StateItem> =>
    (await apiClient.post<StateItem>('/locations/states', {name})).data,
  deleteState: async (id: string): Promise<MutationMessage> =>
    (await apiClient.delete<MutationMessage>(`/locations/states/${id}`)).data,

  /* Districts */
  listDistricts: async (stateId: string): Promise<District[]> =>
    (await apiClient.get<District[]>(`/locations/states/${stateId}/districts`))
      .data,
  createDistrict: async (stateId: string, name: string): Promise<District> =>
    (
      await apiClient.post<District>(`/locations/states/${stateId}/districts`, {
        name,
      })
    ).data,
  bulkDistricts: async (
    stateId: string,
    names: string[],
  ): Promise<{added: number}> =>
    (
      await apiClient.post<{added: number}>(
        `/locations/states/${stateId}/districts/bulk`,
        {names},
      )
    ).data,
  suggestDistricts: async (stateId: string): Promise<SuggestResponse> =>
    (
      await apiClient.post<SuggestResponse>(
        `/locations/states/${stateId}/suggest-districts`,
      )
    ).data,
  deleteDistrict: async (id: string): Promise<MutationMessage> =>
    (await apiClient.delete<MutationMessage>(`/locations/districts/${id}`)).data,

  /* Cities */
  listCities: async (districtId: string): Promise<City[]> =>
    (await apiClient.get<City[]>(`/locations/districts/${districtId}/cities`))
      .data,
  createCity: async (districtId: string, name: string): Promise<City> =>
    (
      await apiClient.post<City>(`/locations/districts/${districtId}/cities`, {
        name,
      })
    ).data,
  bulkCities: async (
    districtId: string,
    names: string[],
  ): Promise<{added: number}> =>
    (
      await apiClient.post<{added: number}>(
        `/locations/districts/${districtId}/cities/bulk`,
        {names},
      )
    ).data,
  suggestCities: async (districtId: string): Promise<SuggestResponse> =>
    (
      await apiClient.post<SuggestResponse>(
        `/locations/districts/${districtId}/suggest-cities`,
      )
    ).data,
  /** Re-run village auto-fetch (AI/govt) for a district. */
  refetchCities: async (districtId: string): Promise<RefetchResponse> =>
    (
      await apiClient.post<RefetchResponse>(
        `/locations/districts/${districtId}/refetch-cities`,
      )
    ).data,
  deleteCity: async (id: string): Promise<MutationMessage> =>
    (await apiClient.delete<MutationMessage>(`/locations/cities/${id}`)).data,

  /* Wards (auto-populated on first fetch) */
  listWards: async (cityId: string): Promise<Ward[]> =>
    (await apiClient.get<Ward[]>(`/locations/cities/${cityId}/wards`)).data,
  createWard: async (
    cityId: string,
    number: string,
    name: string,
  ): Promise<Ward> =>
    (
      await apiClient.post<Ward>(`/locations/cities/${cityId}/wards`, {
        number,
        name,
      })
    ).data,
  /** Force a fresh ward auto-fetch for a city. */
  refetchWards: async (cityId: string): Promise<RefetchResponse> =>
    (
      await apiClient.post<RefetchResponse>(
        `/locations/cities/${cityId}/wards/refetch`,
      )
    ).data,
  deleteWard: async (id: string): Promise<MutationMessage> =>
    (await apiClient.delete<MutationMessage>(`/locations/wards/${id}`)).data,

  /* Localities */
  listLocalities: async (cityId: string): Promise<Locality[]> =>
    (await apiClient.get<Locality[]>(`/locations/cities/${cityId}/localities`))
      .data,
  createLocality: async (cityId: string, name: string): Promise<Locality> =>
    (
      await apiClient.post<Locality>(`/locations/cities/${cityId}/localities`, {
        name,
      })
    ).data,
  bulkLocalities: async (
    cityId: string,
    names: string[],
  ): Promise<{added: number}> =>
    (
      await apiClient.post<{added: number}>(
        `/locations/cities/${cityId}/localities/bulk`,
        {names},
      )
    ).data,
  suggestLocalities: async (cityId: string): Promise<SuggestResponse> =>
    (
      await apiClient.post<SuggestResponse>(
        `/locations/cities/${cityId}/suggest-localities`,
      )
    ).data,
  deleteLocality: async (id: string): Promise<MutationMessage> =>
    (await apiClient.delete<MutationMessage>(`/locations/localities/${id}`)).data,
};
