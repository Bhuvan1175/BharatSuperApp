import {useQuery} from '@tanstack/react-query';
import {usersApi} from '../api/users.api';

export const COMPLETE_PROFILE_QUERY_KEY = ['complete-profile'] as const;

/** GET /users/complete-profile — completion %, completed flag, missing fields. */
export function useCompleteProfile() {
  return useQuery({
    queryKey: COMPLETE_PROFILE_QUERY_KEY,
    queryFn: () => usersApi.getCompleteProfile(),
  });
}
