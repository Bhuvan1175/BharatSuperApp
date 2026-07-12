import React from 'react';
import {useAuthStore} from '@/store/authStore';
import {USE_MOCK_ROLE} from '@/rbac';
import BottomTabNavigator from './BottomTabNavigator';
import {AdminDashboardScreen} from '@screens/admin';
import DepartmentDashboard from '@components/dashboard/DepartmentDashboard';
import DevRoleSwitcher from '@components/dashboard/DevRoleSwitcher';

/**
 * RoleRouter — the single decision point that maps the signed-in user to their
 * home surface. It is now fully backend-driven and generic:
 *
 *   SUPER_ADMIN            → Admin dashboard
 *   has a department       → the generic DepartmentDashboard (works for ANY
 *                            department, including ones created at runtime)
 *   otherwise (citizen)    → the existing 5-tab app
 *
 * No per-module component registry and no hardcoded role list — so a brand-new
 * department needs zero frontend changes.
 */
const RoleRouter: React.FC = () => {
  const role = useAuthStore(s => s.role);
  const department = useAuthStore(s => s.department);

  let dashboard: React.ReactNode;
  if (role === 'SUPER_ADMIN') {
    dashboard = <AdminDashboardScreen />;
  } else if (department) {
    dashboard = <DepartmentDashboard />;
  } else {
    dashboard = <BottomTabNavigator />;
  }

  return (
    <>
      {dashboard}
      {__DEV__ && USE_MOCK_ROLE && <DevRoleSwitcher />}
    </>
  );
};

export default RoleRouter;
