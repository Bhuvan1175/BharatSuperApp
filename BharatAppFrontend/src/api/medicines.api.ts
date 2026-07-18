import {apiClient} from './client';

/** Derived (not stored) — computed by the backend from stockQty vs threshold. */
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type RequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED';

export interface Medicine {
  id: string;
  name: string;
  description: string | null;
  /** Dosage strength label, e.g. "250mg", "500mg", "5ml". */
  strength: string | null;
  manufacturer: string | null;
  /** Batch/lot number for the current stock. */
  batchNumber: string | null;
  expiryDate: string | null;
  unit: string;
  price: number;
  stockQty: number;
  lowStockThreshold: number;
  isActive: boolean;
  stockStatus: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineStats {
  totalMedicines: number;
  totalRequests: number;
  pendingRequests: number;
  lowStockMedicines: number;
  outOfStockMedicines: number;
}

export interface MedicineRequestItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  status: RequestStatus;
  notes: string | null;
  citizenId: string;
  citizenName: string | null;
  decidedById: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  medicine?: {id: string; name: string; unit: string} | null;
  citizen?: {id: string; name: string | null; phoneNumber: string | null} | null;
}

export interface MedicineFilters {
  search?: string;
  includeInactive?: boolean;
}

export interface CreateMedicineBody {
  name: string;
  description?: string;
  strength?: string;
  manufacturer?: string;
  batchNumber?: string;
  /** ISO date string. */
  expiryDate?: string;
  unit?: string;
  price?: number;
  stockQty?: number;
  lowStockThreshold?: number;
}

export type UpdateMedicineBody = Partial<
  Omit<CreateMedicineBody, 'stockQty'>
> & {isActive?: boolean};

export interface MedicineRequestFilters {
  status?: RequestStatus;
  medicineId?: string;
}

export interface CreateMedicineRequestBody {
  medicineId: string;
  quantity: number;
  notes?: string;
}

export interface UpdateRequestStatusBody {
  status: RequestStatus;
  notes?: string;
}

/** The store's pickup location/contact details (backed by its Department row). */
export interface MedicineStore {
  id: string;
  name: string;
  label: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  openingHours: string | null;
}

export interface UpdateStoreBody {
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours?: string;
}

/** One data.gov.in post-office match for a typed pincode. */
export interface PincodeSuggestion {
  officeName: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

/** Medicine Store Dashboard: real inventory + citizen request workflow. */
export const medicinesApi = {
  list: async (filters?: MedicineFilters): Promise<Medicine[]> =>
    (await apiClient.get<Medicine[]>('/medicines', {params: filters})).data,

  getOne: async (id: string): Promise<Medicine> =>
    (await apiClient.get<Medicine>(`/medicines/${id}`)).data,

  stats: async (): Promise<MedicineStats> =>
    (await apiClient.get<MedicineStats>('/medicines/stats')).data,

  create: async (body: CreateMedicineBody): Promise<Medicine> =>
    (await apiClient.post<Medicine>('/medicines', body)).data,

  update: async (id: string, body: UpdateMedicineBody): Promise<Medicine> =>
    (await apiClient.patch<Medicine>(`/medicines/${id}`, body)).data,

  updateStock: async (id: string, stockQty: number): Promise<Medicine> =>
    (await apiClient.patch<Medicine>(`/medicines/${id}/stock`, {stockQty})).data,

  remove: async (id: string): Promise<{success: boolean; message: string}> =>
    (await apiClient.delete<{success: boolean; message: string}>(`/medicines/${id}`))
      .data,

  listRequests: async (
    filters?: MedicineRequestFilters,
  ): Promise<MedicineRequestItem[]> =>
    (
      await apiClient.get<MedicineRequestItem[]>('/medicines/requests', {
        params: filters,
      })
    ).data,

  myRequests: async (): Promise<MedicineRequestItem[]> =>
    (await apiClient.get<MedicineRequestItem[]>('/medicines/requests/mine')).data,

  createRequest: async (
    body: CreateMedicineRequestBody,
  ): Promise<MedicineRequestItem> =>
    (await apiClient.post<MedicineRequestItem>('/medicines/requests', body)).data,

  updateRequestStatus: async (
    id: string,
    body: UpdateRequestStatusBody,
  ): Promise<MedicineRequestItem> =>
    (
      await apiClient.patch<MedicineRequestItem>(
        `/medicines/requests/${id}/status`,
        body,
      )
    ).data,

  /** Pickup location/contact — visible to any authenticated user. */
  getStore: async (): Promise<MedicineStore> =>
    (await apiClient.get<MedicineStore>('/medicines/store')).data,

  /** Manager only: edit the pickup location/contact. */
  updateStore: async (body: UpdateStoreBody): Promise<MedicineStore> =>
    (await apiClient.patch<MedicineStore>('/medicines/store', body)).data,

  /** Manager only: address autocomplete — matching localities for a 6-digit PIN. */
  pincodeLookup: async (pincode: string): Promise<PincodeSuggestion[]> =>
    (
      await apiClient.get<PincodeSuggestion[]>('/medicines/store/pincode-lookup', {
        params: {pincode},
      })
    ).data,

  /** Manager only: fallback geocode for a free-typed address. */
  geocode: async (address: string): Promise<GeocodeResult | null> =>
    (
      await apiClient.get<GeocodeResult | null>('/medicines/store/geocode', {
        params: {address},
      })
    ).data,
};
