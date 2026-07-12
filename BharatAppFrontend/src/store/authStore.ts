import {create} from 'zustand';
import {ApiDepartment, ApiUser} from '../api/types';
import {authApi} from '../api/auth.api';
import {usersApi} from '../api/users.api';
import {tokenStorage} from '../api/tokenStorage';
import {setOnAuthLogout} from '../api/client';
import {MOCK_ROLE, MODULES, ModuleKey, ROLE_CONFIG, USE_MOCK_ROLE} from '@/rbac';

/**
 * The RBAC slice is now BACKEND-DRIVEN: role name, department object and
 * permissions come straight from the logged-in user (verify-otp / profile), not
 * from a hardcoded frontend table. This is what lets a brand-new department
 * (created at runtime by the super admin) get a working dashboard with no app
 * rebuild — the frontend simply trusts the backend's role + department.
 */
interface RbacSlice {
  /** Backend role NAME, e.g. 'MEDICINE_MANAGER', 'SUPER_ADMIN', 'PUBLIC_USER'. */
  role: string;
  /** The user's department (managers only), or null. */
  department: ApiDepartment | null;
  /** Permission strings from the backend role, e.g. ['medicine:manage']. */
  permissions: string[];
}

interface AuthState extends RbacSlice {
  user: ApiUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;

  setSession: (
    user: ApiUser,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  setUser: (user: ApiUser) => void;
  /** Set role by name — used only by the DevRoleSwitcher in mock mode. */
  setRole: (roleName: string) => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
}

const EMPTY: RbacSlice = {
  role: 'PUBLIC_USER',
  department: null,
  permissions: [],
};

/** Live mode: derive the RBAC slice from the backend user object. */
const sliceFromUser = (user: ApiUser | null): RbacSlice => ({
  role: user?.role?.name ?? 'PUBLIC_USER',
  department: user?.department ?? null,
  permissions: user?.role?.permissions ?? [],
});

/** Mock mode: derive from the frontend ROLE_CONFIG for known roles. */
const sliceFromRole = (roleName: string): RbacSlice => {
  const cfg = ROLE_CONFIG[roleName as keyof typeof ROLE_CONFIG];
  if (!cfg) {
    return {role: roleName, department: null, permissions: []};
  }
  const moduleKey = cfg.modules[0] as ModuleKey | undefined;
  const mod = moduleKey ? MODULES[moduleKey] : undefined;
  const department: ApiDepartment | null = cfg.department
    ? {name: cfg.department, label: mod?.label ?? cfg.label, moduleKey}
    : null;
  return {
    role: roleName,
    department,
    permissions: cfg.permissions as string[],
  };
};

const resolveSlice = (user: ApiUser | null): RbacSlice =>
  USE_MOCK_ROLE ? sliceFromRole(MOCK_ROLE) : sliceFromUser(user);

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  ...EMPTY,

  setSession: async (user, accessToken, refreshToken) => {
    await tokenStorage.saveTokens(accessToken, refreshToken);
    set({user, isAuthenticated: true, ...resolveSlice(user)});
  },

  setUser: user => set({user}),

  setRole: roleName => set(sliceFromRole(roleName)),

  bootstrap: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({user: null, isAuthenticated: false, ...EMPTY});
        return;
      }
      const user = await usersApi.getProfile();
      set({user, isAuthenticated: true, ...resolveSlice(user)});
    } catch {
      await tokenStorage.clearTokens();
      set({user: null, isAuthenticated: false, ...EMPTY});
    } finally {
      set({isBootstrapping: false});
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network / 401 — we always log out locally
    }
    await tokenStorage.clearTokens();
    set({user: null, isAuthenticated: false, ...EMPTY});
  },

  forceLogout: () => set({user: null, isAuthenticated: false, ...EMPTY}),
}));

setOnAuthLogout(() => {
  useAuthStore.getState().forceLogout();
});
