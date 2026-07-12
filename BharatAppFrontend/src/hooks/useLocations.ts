import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {locationApi} from '../api/location.api';

export const LOCATION_KEYS = {
  aiStatus: ['locations', 'ai-status'] as const,
  states: ['locations', 'states'] as const,
  districts: (stateId?: string) =>
    ['locations', 'districts', stateId ?? ''] as const,
  cities: (districtId?: string) =>
    ['locations', 'cities', districtId ?? ''] as const,
  localities: (cityId?: string) =>
    ['locations', 'localities', cityId ?? ''] as const,
};

export const useAiStatus = () =>
  useQuery({
    queryKey: LOCATION_KEYS.aiStatus,
    queryFn: locationApi.aiStatus,
    staleTime: 5 * 60 * 1000,
  });

/* ------------------------------- Queries ------------------------------ */

export const useStates = () =>
  useQuery({queryKey: LOCATION_KEYS.states, queryFn: locationApi.listStates});

export const useDistricts = (stateId?: string) =>
  useQuery({
    queryKey: LOCATION_KEYS.districts(stateId),
    queryFn: () => locationApi.listDistricts(stateId as string),
    enabled: !!stateId,
  });

export const useCities = (districtId?: string) =>
  useQuery({
    queryKey: LOCATION_KEYS.cities(districtId),
    queryFn: () => locationApi.listCities(districtId as string),
    enabled: !!districtId,
  });

export const useLocalities = (cityId?: string) =>
  useQuery({
    queryKey: LOCATION_KEYS.localities(cityId),
    queryFn: () => locationApi.listLocalities(cityId as string),
    enabled: !!cityId,
  });

/* ------------------------------ Mutations ----------------------------- */

export const useCreateState = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => locationApi.createState(name),
    onSuccess: () => qc.invalidateQueries({queryKey: LOCATION_KEYS.states}),
  });
};

export const useDeleteState = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationApi.deleteState(id),
    onSuccess: () => qc.invalidateQueries({queryKey: ['locations']}),
  });
};

export const useCreateDistrict = (stateId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => locationApi.createDistrict(stateId, name),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: LOCATION_KEYS.districts(stateId)});
      qc.invalidateQueries({queryKey: LOCATION_KEYS.states});
    },
  });
};

export const useBulkDistricts = (stateId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => locationApi.bulkDistricts(stateId, names),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: LOCATION_KEYS.districts(stateId)});
      qc.invalidateQueries({queryKey: LOCATION_KEYS.states});
    },
  });
};

export const useDeleteDistrict = (stateId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationApi.deleteDistrict(id),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: LOCATION_KEYS.districts(stateId)});
      qc.invalidateQueries({queryKey: LOCATION_KEYS.states});
    },
  });
};

export const useCreateCity = (districtId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => locationApi.createCity(districtId, name),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: LOCATION_KEYS.cities(districtId)});
      qc.invalidateQueries({queryKey: LOCATION_KEYS.districts()});
    },
  });
};

export const useBulkCities = (districtId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => locationApi.bulkCities(districtId, names),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: LOCATION_KEYS.cities(districtId)}),
  });
};

export const useDeleteCity = (districtId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationApi.deleteCity(id),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: LOCATION_KEYS.cities(districtId)}),
  });
};

export const useCreateLocality = (cityId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => locationApi.createLocality(cityId, name),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: LOCATION_KEYS.localities(cityId)}),
  });
};

export const useBulkLocalities = (cityId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => locationApi.bulkLocalities(cityId, names),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: LOCATION_KEYS.localities(cityId)}),
  });
};

export const useDeleteLocality = (cityId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationApi.deleteLocality(id),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: LOCATION_KEYS.localities(cityId)}),
  });
};

/* ------------------------------- Suggest ------------------------------ */

export const useSuggestDistricts = () =>
  useMutation({mutationFn: (stateId: string) => locationApi.suggestDistricts(stateId)});

export const useSuggestCities = () =>
  useMutation({mutationFn: (districtId: string) => locationApi.suggestCities(districtId)});

export const useSuggestLocalities = () =>
  useMutation({mutationFn: (cityId: string) => locationApi.suggestLocalities(cityId)});
