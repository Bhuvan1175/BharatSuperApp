import {create} from 'zustand';
import {ApiUser} from '../api/types';
import {authApi} from '../api/auth.api';
import {usersApi} from '../api/users.api';
import {tokenStorage} from '../api/tokenStorage';
import {setOnAuthLogout} from '../api/client';
import {
  DEFAULT_ROLE,
  Department,
  getRoleConfig,
  MOCK_ROLE,
  normalizeRole,
  Permission,
  Role,
  USE_MOCK_ROLE,
} from '@/rbac';

interface AuthState {
  /** The logged-in user, or null when signed out. */
  user: ApiUser | null;
  /** True once we have a valid session. */
  isAuthenticated: boolean;
  /** True while the app is checking storage for an existing session at startup. */
  isBootstrapping: boolean;

  /* ---- RBAC slice (kept in sync with the current role) ---- */
  /** The current user's role (drives dashboard routing & guards). */
  role: Role;
  /** The role's owning department, or null for citizen / super-admin. */
  department: Department | null;
  /** The role's flat permission list. */
  permissions: Permission[];

  /** Called after a successful verify-otp: persist tokens + set the user. */
  setSession: (
    user: ApiUser,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  /** Replace the current user (e.g. after profile update / image upload). */
  setUser: (user: ApiUser) => void;
  /** Set the role directly — used by the DevRoleSwitcher when mocking. */
  setRole: (role: Role) => void;
  /** App-startup check: load tokens, validate by fetching the profile. */
  bootstrap: () => Promise<void>;
  /** User-initiated logout: tell the backend, then clear everything. */
  logout: () => Promise<void>;
  /** Local-only logout used by the axios interceptor when refresh fails. */
  forceLogout: () => void;
}

/**
 * Derive the RBAC slice from a role in ONE place, so role/department/permissions
 * can never drift apart.
 */
const roleSlice = (
  role: Role,
): Pick<AuthState, 'role' | 'department' | 'permissions'> => {
  const cfg = getRoleConfig(role);
  return {role, department: cfg.department, permissions: cfg.permissions};
};

/**
 * resolveRole — THE single seam between "who the user is" and "what role they
 * have".
 *   • Mock (USE_MOCK_ROLE true): returns MOCK_ROLE.
 *   • Live (now): reads the role NAME from the backend user (`role.name`) and
 *     maps it via normalizeRole (unknown/missing → PUBLIC_USER).
 */
const resolveRole = (user: ApiUser | null): Role =>
  USE_MOCK_ROLE ? MOCK_ROLE : normalizeRole(user?.role?.name);

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  ...roleSlice(DEFAULT_ROLE),

  setSession: async (user, accessToken, refreshToken) => {
    await tokenStorage.saveTokens(accessToken, refreshToken);
    set({user, isAuthenticated: true, ...roleSlice(resolveRole(user))});
  },

  setUser: user => set({user}),

  setRole: role => set(roleSlice(role)),

  bootstrap: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({user: null, isAuthenticated: false, ...roleSlice(DEFAULT_ROLE)});
        return;
      }
      // A token exists → validate it by fetching the profile.
      // The axios interceptor auto-refreshes if the access token is expired.
      const user = await usersApi.getProfile();
      set({user, isAuthenticated: true, ...roleSlice(resolveRole(user))});
    } catch {
      // Token invalid or refresh failed → start clean.
      await tokenStorage.clearTokens();
      set({user: null, isAuthenticated: false, ...roleSlice(DEFAULT_ROLE)});
    } finally {
      set({isBootstrapping: false});
    }
  },

  logout: async () => {
    try {
      await authApi.logout(); // best-effort: clears refresh token server-side
    } catch {
      // ignore network / 401 — we always log out locally
    }
    await tokenStorage.clearTokens();
    set({user: null, isAuthenticated: false, ...roleSlice(DEFAULT_ROLE)});
  },

  forceLogout: () => {
    // Interceptor already cleared tokens; just reset in-memory state.
    set({user: null, isAuthenticated: false, ...roleSlice(DEFAULT_ROLE)});
  },
}));

// Wire the axios interceptor's "refresh failed" path to this store so an
// expired refresh token cleanly logs the user out. Registered once at import.
setOnAuthLogout(() => {
  useAuthStore.getState().forceLogout();
});
