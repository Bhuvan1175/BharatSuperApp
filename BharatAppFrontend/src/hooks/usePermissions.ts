import {useAuthStore} from '../store/authStore';

/**
 * usePermissions — capability checks driven entirely by the backend-provided
 * role / department / permissions on the auth store. Works for any role,
 * including departments created at runtime.
 */
export const usePermissions = () => {
  const role = useAuthStore(s => s.role);
  const department = useAuthStore(s => s.department);
  const permissions = useAuthStore(s => s.permissions);

  const can = (permission: string) =>
    permissions.includes('*') || permissions.includes(permission);

  return {
    role,
    department,
    permissions,
    /** Does the user hold this exact permission? ('*' grants all.) */
    can,
    /** Can the user view a module? */
    canView: (moduleKey: string) => can(`${moduleKey}:view`),
    /** Can the user manage a module? */
    canManage: (moduleKey: string) => can(`${moduleKey}:manage`),
    isSuperAdmin: role === 'SUPER_ADMIN',
    isDepartmentManager: !!department && role !== 'SUPER_ADMIN',
  };
};
