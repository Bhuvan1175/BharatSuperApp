import {useAuthStore} from '../store/authStore';

/**
 * useRole — the current user's role NAME (from the backend). It's a string
 * (any backend role name, including runtime-created ones), not the fixed
 * frontend union, so new roles work without a code change.
 */
export const useRole = (): string => useAuthStore(s => s.role);
