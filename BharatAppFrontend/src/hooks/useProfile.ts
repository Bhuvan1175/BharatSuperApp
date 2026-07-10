import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {usersApi, UpdateProfilePayload} from '../api/users.api';
import {useAuthStore} from '../store/authStore';
import {COMPLETE_PROFILE_QUERY_KEY} from './useCompleteProfile';

export const PROFILE_QUERY_KEY = ['profile'] as const;

/**
 * Fetches GET /users/profile and keeps the Zustand store in sync.
 * Screens read the user from the store; this hook keeps it fresh.
 */
export function useProfile() {
  const setUser = useAuthStore(s => s.setUser);
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const user = await usersApi.getProfile();
      setUser(user);
      return user;
    },
  });
}

/**
 * PATCH /users/profile. On success, updates the store + query cache so the
 * whole app reflects the new profile immediately, and refreshes completion %.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      usersApi.updateProfile(payload),
    onSuccess: user => {
      setUser(user);
      queryClient.setQueryData(PROFILE_QUERY_KEY, user);
      queryClient.invalidateQueries({queryKey: COMPLETE_PROFILE_QUERY_KEY});
    },
  });
}
