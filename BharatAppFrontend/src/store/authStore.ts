import {create} from 'zustand';
import {ApiUser} from '../api/types';
import {authApi} from '../api/auth.api';
import {usersApi} from '../api/users.api';
import {tokenStorage} from '../api/tokenStorage';
import {setOnAuthLogout} from '../api/client';

interface AuthState {
  /** The logged-in user, or null when signed out. */
  user: ApiUser | null;
  /** True once we have a valid session. */
  isAuthenticated: boolean;
  /** True while the app is checking storage for an existing session at startup. */
  isBootstrapping: boolean;

  /** Called after a successful verify-otp: persist tokens + set the user. */
  setSession: (
    user: ApiUser,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  /** Replace the current user (e.g. after profile update / image upload). */
  setUser: (user: ApiUser) => void;
  /** App-startup check: load tokens, validate by fetching the profile. */
  bootstrap: () => Promise<void>;
  /** User-initiated logout: tell the backend, then clear everything. */
  logout: () => Promise<void>;
  /** Local-only logout used by the axios interceptor when refresh fails. */
  forceLogout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setSession: async (user, accessToken, refreshToken) => {
    await tokenStorage.saveTokens(accessToken, refreshToken);
    set({user, isAuthenticated: true});
  },

  setUser: user => set({user}),

  bootstrap: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({user: null, isAuthenticated: false});
        return;
      }
      // A token exists → validate it by fetching the profile.
      // The axios interceptor auto-refreshes if the access token is expired.
      const user = await usersApi.getProfile();
      set({user, isAuthenticated: true});
    } catch {
      // Token invalid or refresh failed → start clean.
      await tokenStorage.clearTokens();
      set({user: null, isAuthenticated: false});
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
    set({user: null, isAuthenticated: false});
  },

  forceLogout: () => {
    // Interceptor already cleared tokens; just reset in-memory state.
    set({user: null, isAuthenticated: false});
  },
}));

// Wire the axios interceptor's "refresh failed" path to this store so an
// expired refresh token cleanly logs the user out. Registered once at import.
setOnAuthLogout(() => {
  useAuthStore.getState().forceLogout();
});
