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
  wards: (cityId?: string) => ['locations', 'wards', cityId ?? ''] as const,
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

/**
 * Wards for a city. The backend lazily auto-fetches & saves them on first
 * access, so simply mounting this hook (when a village is selected) makes the
 * ward dropdowns populate on their own. The first call can take a few seconds
 * while the provider responds.
 */
export const useWards = (cityId?: string) =>
  useQuery({
    queryKey: LOCATION_KEYS.wards(cityId),
    queryFn: () => locationApi.listWards(cityId as string),
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
    // Creating a district kicks off a background village fetch on the backend.
    // Refresh districts immediately, then re-check the cities list a few times
    // so the auto-fetched villages appear on their own once they're saved.
    onSuccess: () => {
      qc.invalidateQueries({queryKey: LOCATION_KEYS.districts(stateId)});
      qc.invalidateQueries({queryKey: LOCATION_KEYS.states});
      const bumpCities = () =>
        qc.invalidateQueries({queryKey: ['locations', 'cities']});
      bumpCities();
      setTimeout(bumpCities, 4000);
      setTimeout(bumpCities, 9000);
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

/** Re-run village auto-fetch for an existing district. */
export const useRefetchCities = (districtId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => locationApi.refetchCities(districtId),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: LOCATION_KEYS.cities(districtId)}),
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

/* -------------------------------- Wards ------------------------------- */

export const useCreateWard = (cityId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({number, name}: {number: string; name: string}) =>
      locationApi.createWard(cityId, number, name),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: LOCATION_KEYS.wards(cityId)});
      qc.invalidateQueries({queryKey: LOCATION_KEYS.cities()});
    },
  });
};

export const useDeleteWard = (cityId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationApi.deleteWard(id),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: LOCATION_KEYS.wards(cityId)}),
  });
};

export const useRefetchWards = (cityId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => locationApi.refetchWards(cityId),
    onSuccess: () =>
      qc.invalidateQueries({queryKey: LOCATION_KEYS.wards(cityId)}),
  });
};

/* ----------------------------- Localities ----------------------------- */

export const useCreateLocality = (cityId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {name: string; pincode?: string}) =>
      locationApi.createLocality(cityId, args),
    // The PIN code is geocoded in the background (data.gov.in lookup), so
    // re-check the list a couple of times shortly after — same pattern as
    // useCreateDistrict's village auto-fetch — for the resolved coordinates
    // to show up without a manual refresh.
    onSuccess: () => {
      const bump = () =>
        qc.invalidateQueries({queryKey: LOCATION_KEYS.localities(cityId)});
      bump();
      setTimeout(bump, 4000);
    },
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
  useMutation({
    mutationFn: (stateId: string) => locationApi.suggestDistricts(stateId),
  });

export const useSuggestCities = () =>
  useMutation({
    mutationFn: (districtId: string) => locationApi.suggestCities(districtId),
  });

export const useSuggestLocalities = () =>
  useMutation({
    mutationFn: (cityId: string) => locationApi.suggestLocalities(cityId),
  });
