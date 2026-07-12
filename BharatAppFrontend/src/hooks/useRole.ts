import {Role} from '@/rbac';
import {useAuthStore} from '../store/authStore';

/**
 * useRole — the single accessor for the current user's role.
 *
 * Now backed by the Zustand auth store (Step 8). The mock switcher (Step 9) and
 * the backend JWT (Step 10) both flow through the store's role, so every
 * consumer (RoleRouter, RoleGuard, dashboards, usePermissions) stays unchanged
 * regardless of where the role ultimately comes from.
 */
export const useRole = (): Role => useAuthStore(s => s.role);
