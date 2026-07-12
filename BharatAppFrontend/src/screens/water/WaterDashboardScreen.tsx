import React from 'react';
import DepartmentDashboard from '@components/dashboard/DepartmentDashboard';

/**
 * Water department home (WATER_MANAGER).
 * Thin wrapper over the shared DepartmentDashboard template — the module key is
 * the only thing that differs between departments.
 */
const WaterDashboardScreen: React.FC = () => (
  <DepartmentDashboard module="water" />
);

export default WaterDashboardScreen;
