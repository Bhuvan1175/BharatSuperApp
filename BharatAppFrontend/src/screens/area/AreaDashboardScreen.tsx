import React from 'react';
import DepartmentDashboard from '@components/dashboard/DepartmentDashboard';

/**
 * Area department home (AREA_MANAGER).
 * Thin wrapper over the shared DepartmentDashboard template — the module key is
 * the only thing that differs between departments.
 */
const AreaDashboardScreen: React.FC = () => (
  <DepartmentDashboard module="area" />
);

export default AreaDashboardScreen;
