import React from 'react';
import {useAuthStore} from '@/store/authStore';
import {USE_MOCK_ROLE} from '@/rbac';
import BottomTabNavigator from './BottomTabNavigator';
import {AdminDashboardScreen} from '@screens/admin';
import DepartmentDashboard from '@components/dashboard/DepartmentDashboard';
import DevRoleSwitcher from '@components/dashboard/DevRoleSwitcher';
import {MedicineDashboardScreen} from '@screens/medicine';
import {AreaDashboardScreen} from '@screens/area';

/**
 * RoleRouter — the single decision point that maps the signed-in user to their
 * home surface. It is backend-driven and generic:
 *
 *   SUPER_ADMIN            → Admin dashboard
 *   department "medicine"  → the bespoke Medicine Store Dashboard (real
 *                            inventory + citizen request workflow — a first-
 *                            class domain, not generic bulletin entries)
 *   department "area"      → the bespoke Area Intelligence Dashboard (data
 *                            providers + background job pipeline — also a
 *                            first-class domain, not generic bulletin entries)
 *   any other department   → the generic DepartmentDashboard (works for ANY
 *                            department, including ones created at runtime)
 *   otherwise (citizen)    → the existing 6-tab app (now incl. Area Intel)
 *
 * Only Medicine and Area are special-cased; every other department still
 * needs zero frontend changes to get a working dashboard.
 */
const RoleRouter: React.FC = () => {
  const role = useAuthStore(s => s.role);
  const department = useAuthStore(s => s.department);

  let dashboard: React.ReactNode;
  if (role === 'SUPER_ADMIN') {
    dashboard = <AdminDashboardScreen />;
  } else if (department?.moduleKey === 'medicine') {
    dashboard = <MedicineDashboardScreen />;
  } else if (department?.moduleKey === 'area') {
    dashboard = <AreaDashboardScreen />;
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
