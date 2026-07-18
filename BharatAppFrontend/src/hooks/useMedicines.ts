import {useMutation, useQuery, useQueryClient, keepPreviousData} from '@tanstack/react-query';
import {
  CreateMedicineBody,
  CreateMedicineRequestBody,
  medicinesApi,
  MedicineFilters,
  MedicineRequestFilters,
  UpdateMedicineBody,
  UpdateRequestStatusBody,
  UpdateStoreBody,
} from '../api/medicines.api';

export const MEDICINE_KEYS = {
  list: (filters?: MedicineFilters) => ['medicines', filters ?? {}] as const,
  stats: ['medicines', 'stats'] as const,
  one: (id: string) => ['medicines', 'one', id] as const,
  requests: (filters?: MedicineRequestFilters) =>
    ['medicines', 'requests', filters ?? {}] as const,
  myRequests: ['medicines', 'requests', 'mine'] as const,
  store: ['medicines', 'store'] as const,
};

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({queryKey: ['medicines']});

/* ---------------------------------------------------------------------- */
/* Inventory                                                               */
/* ---------------------------------------------------------------------- */

export const useMedicines = (filters?: MedicineFilters) =>
  useQuery({
    queryKey: MEDICINE_KEYS.list(filters),
    queryFn: () => medicinesApi.list(filters),
  });

export const useMedicine = (id?: string) =>
  useQuery({
    queryKey: MEDICINE_KEYS.one(id ?? ''),
    queryFn: () => medicinesApi.getOne(id as string),
    enabled: !!id,
  });

/** Manager dashboard counts: Total Medicines, Total Requests, Pending, Low Stock. */
export const useMedicineStats = () =>
  useQuery({
    queryKey: MEDICINE_KEYS.stats,
    queryFn: () => medicinesApi.stats(),
  });

export const useCreateMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMedicineBody) => medicinesApi.create(body),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, body}: {id: string; body: UpdateMedicineBody}) =>
      medicinesApi.update(id, body),
    onSuccess: () => invalidateAll(qc),
  });
};

/** Sets the absolute stock quantity (e.g. after a restock count). */
export const useUpdateMedicineStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, stockQty}: {id: string; stockQty: number}) =>
      medicinesApi.updateStock(id, stockQty),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicinesApi.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
};

/* ---------------------------------------------------------------------- */
/* Requests                                                                 */
/* ---------------------------------------------------------------------- */

/** Manager: every citizen request, optionally filtered by status/medicine. */
export const useMedicineRequests = (filters?: MedicineRequestFilters) =>
  useQuery({
    queryKey: MEDICINE_KEYS.requests(filters),
    queryFn: () => medicinesApi.listRequests(filters),
  });

/** Citizen: their own request history. */
export const useMyMedicineRequests = () =>
  useQuery({
    queryKey: MEDICINE_KEYS.myRequests,
    queryFn: () => medicinesApi.myRequests(),
  });

/** Citizen: place a new request for a medicine. */
export const useCreateMedicineRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMedicineRequestBody) =>
      medicinesApi.createRequest(body),
    onSuccess: () => invalidateAll(qc),
  });
};

/** Manager: accept / reject / mark ready / complete a request. */
export const useUpdateMedicineRequestStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, body}: {id: string; body: UpdateRequestStatusBody}) =>
      medicinesApi.updateRequestStatus(id, body),
    onSuccess: () => invalidateAll(qc),
  });
};

/* ---------------------------------------------------------------------- */
/* Store profile (pickup location / contact)                               */
/* ---------------------------------------------------------------------- */

/** Pickup location/contact — any authenticated user can read it. */
export const useMedicineStore = () =>
  useQuery({
    queryKey: MEDICINE_KEYS.store,
    queryFn: () => medicinesApi.getStore(),
    retry: false,
  });

/** Manager: edit the pickup location/contact. */
export const useUpdateMedicineStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateStoreBody) => medicinesApi.updateStore(body),
    onSuccess: () => qc.invalidateQueries({queryKey: MEDICINE_KEYS.store}),
  });
};

/**
 * Address autocomplete: matching localities for a 6-digit PIN, each already
 * carrying real lat/long from data.gov.in where available. Only runs once a
 * full 6-digit pincode has been typed — pass it already-debounced.
 */
export const usePincodeLookup = (pincode: string) => {
  const clean = pincode.trim();
  return useQuery({
    queryKey: ['medicines', 'pincode-lookup', clean],
    queryFn: () => medicinesApi.pincodeLookup(clean),
    enabled: /^\d{6}$/.test(clean),
    placeholderData: keepPreviousData,
  });
};

/** Fallback geocode for a free-typed address (no coordinates from the picked locality). */
export const useGeocodeAddress = () =>
  useMutation({
    mutationFn: (address: string) => medicinesApi.geocode(address),
  });
