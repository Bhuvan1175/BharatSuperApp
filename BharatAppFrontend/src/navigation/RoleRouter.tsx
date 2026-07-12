import React from 'react';
import {DashboardRoute, getRoleConfig, USE_MOCK_ROLE} from '@/rbac';
import {useRole} from '@hooks/useRole';
import BottomTabNavigator from './BottomTabNavigator';
import {AdminDashboardScreen} from '@screens/admin';
import {MedicineDashboardScreen} from '@screens/medicine';
import {FuelDashboardScreen} from '@screens/fuel';
import {WaterDashboardScreen} from '@screens/water';
import {ElectricityDashboardScreen} from '@screens/electricity';
import {SchemeDashboardScreen} from '@screens/scheme';
import {AreaDashboardScreen} from '@screens/area';
import DevRoleSwitcher from '@components/dashboard/DevRoleSwitcher';

/**
 * Registry: dashboard route → the component that renders that role's home.
 * Adding a role's home surface = one entry here. No conditional logic and no
 * hardcoded role checks — RoleRouter just looks the component up.
 *
 * PUBLIC_USER keeps the existing 5-tab experience completely unchanged.
 */
const DASHBOARD_REGISTRY: Record<DashboardRoute, React.ComponentType> = {
  CitizenDashboard: BottomTabNavigator,
  AdminDashboard: AdminDashboardScreen,
  MedicineDashboard: MedicineDashboardScreen,
  FuelDashboard: FuelDashboardScreen,
  WaterDashboard: WaterDashboardScreen,
  ElectricityDashboard: ElectricityDashboardScreen,
  SchemeDashboard: SchemeDashboardScreen,
  AreaDashboard: AreaDashboardScreen,
};

/**
 * RoleRouter — the single decision point mapping the current user's role to the
 * correct home surface. Mounted as the `Main` screen in RootNavigator's
 * authenticated stack.
 *
 * The DevRoleSwitcher only appears in dev builds AND only when USE_MOCK_ROLE is
 * true — so with the real backend connected, a user can NEVER switch to another
 * role's dashboard. The role comes solely from the backend login.
 */
const RoleRouter: React.FC = () => {
  const role = useRole();
  const {dashboard} = getRoleConfig(role);
  const Dashboard = DASHBOARD_REGISTRY[dashboard];
  return (
    <>
      <Dashboard />
      {__DEV__ && USE_MOCK_ROLE && <DevRoleSwitcher />}
    </>
  );
};

export default RoleRouter;
