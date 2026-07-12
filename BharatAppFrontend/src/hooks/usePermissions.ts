import {
  canManageModule,
  canViewModule,
  getAccessibleModules,
  hasPermission,
  isDepartmentRole,
  ModuleKey,
  Permission,
} from '@/rbac';
import {useRole} from './useRole';

/**
 * usePermissions — ergonomic, role-aware capability checks for screens and
 * components. Ask capabilities ("can I manage fuel?"), never identities ("am I
 * the fuel manager?"), so UI written today keeps working when new roles exist.
 *
 * Example:
 *   const {canManage} = usePermissions();
 *   {canManage('medicine') && <Button label="Add listing" ... />}
 */
export const usePermissions = () => {
  const role = useRole();
  return {
    role,
    /** Does the current role hold this permission? */
    can: (permission: Permission) => hasPermission(role, permission),
    /** Can the current role view this module? */
    canView: (module: ModuleKey) => canViewModule(role, module),
    /** Can the current role manage this module? */
    canManage: (module: ModuleKey) => canManageModule(role, module),
    /** Modules the current role may enter. */
    accessibleModules: getAccessibleModules(role),
    /** True for department managers (not citizen / super-admin). */
    isDepartment: isDepartmentRole(role),
  };
};
