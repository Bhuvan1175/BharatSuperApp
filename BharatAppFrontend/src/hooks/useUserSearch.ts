import {useQuery, keepPreviousData} from '@tanstack/react-query';
import {usersApi} from '../api/users.api';

/**
 * GET /users/search?query=... — debounced user search.
 * Only runs once there's at least 1 character. keepPreviousData keeps the old
 * results on screen while the next query loads (no flicker while typing).
 */
export function useUserSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['user-search', q],
    queryFn: () => usersApi.searchUsers(q),
    enabled: q.length >= 1,
    placeholderData: keepPreviousData,
  });
}
