import {apiClient} from './client';

export interface Listing {
  id: string;
  moduleKey: string;
  type: string;
  title: string;
  body: string | null;
  status: string;
  scheduledAt: string | null;
  expiresAt: string | null;
  data: Record<string, unknown> | null;
  cityId: string | null;
  localityId: string | null;
  wardId: string | null;
  city?: {id: string; name: string} | null;
  locality?: {id: string; name: string} | null;
  ward?: {id: string; number: string; name: string} | null;
  createdAt: string;
}

export interface ListingStats {
  total: number;
  active: number;
  scheduled: number;
  archived: number;
}

export interface ListingFilters {
  moduleKey?: string;
  localityId?: string;
  cityId?: string;
  wardId?: string;
  status?: string;
  type?: string;
}

export interface CreateListingBody {
  moduleKey: string;
  type?: string;
  title: string;
  body?: string;
  status?: string;
  scheduledAt?: string;
  expiresAt?: string;
  cityId?: string;
  localityId?: string;
  wardId?: string;
  data?: Record<string, unknown>;
}

export type UpdateListingBody = Partial<Omit<CreateListingBody, 'moduleKey'>>;

export interface MutationMessage {
  success: boolean;
  message: string;
}

/** Generic module entries (Water updates, alerts, listings, …). */
export const listingsApi = {
  list: async (filters?: ListingFilters): Promise<Listing[]> =>
    (await apiClient.get<Listing[]>('/listings', {params: filters})).data,

  stats: async (moduleKey: string): Promise<ListingStats> =>
    (await apiClient.get<ListingStats>('/listings/stats', {params: {moduleKey}}))
      .data,

  getOne: async (id: string): Promise<Listing> =>
    (await apiClient.get<Listing>(`/listings/${id}`)).data,

  create: async (body: CreateListingBody): Promise<Listing> =>
    (await apiClient.post<Listing>('/listings', body)).data,

  update: async (id: string, body: UpdateListingBody): Promise<Listing> =>
    (await apiClient.patch<Listing>(`/listings/${id}`, body)).data,

  remove: async (id: string): Promise<MutationMessage> =>
    (await apiClient.delete<MutationMessage>(`/listings/${id}`)).data,
};
