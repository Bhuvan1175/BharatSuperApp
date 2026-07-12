import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  CreateListingBody,
  ListingFilters,
  listingsApi,
  UpdateListingBody,
} from '../api/listings.api';

export const LISTING_KEYS = {
  list: (filters?: ListingFilters) => ['listings', filters ?? {}] as const,
  stats: (moduleKey?: string) => ['listings', 'stats', moduleKey ?? ''] as const,
  one: (id: string) => ['listings', 'one', id] as const,
};

export const useListings = (filters?: ListingFilters) =>
  useQuery({
    queryKey: LISTING_KEYS.list(filters),
    queryFn: () => listingsApi.list(filters),
    enabled: !!filters?.moduleKey,
  });

export const useListingStats = (moduleKey?: string) =>
  useQuery({
    queryKey: LISTING_KEYS.stats(moduleKey),
    queryFn: () => listingsApi.stats(moduleKey as string),
    enabled: !!moduleKey,
  });

export const useListing = (id?: string) =>
  useQuery({
    queryKey: LISTING_KEYS.one(id ?? ''),
    queryFn: () => listingsApi.getOne(id as string),
    enabled: !!id,
  });

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({queryKey: ['listings']});

export const useCreateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateListingBody) => listingsApi.create(body),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, body}: {id: string; body: UpdateListingBody}) =>
      listingsApi.update(id, body),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingsApi.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
};
