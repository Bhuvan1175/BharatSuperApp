import {QueryClient} from '@tanstack/react-query';

/**
 * Shared React Query client.
 * - retry once on failure (the interceptor already handles 401 refresh)
 * - short staleTime so profile data feels fresh without hammering the API
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
