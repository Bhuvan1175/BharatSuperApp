import React from 'react';
import DepartmentDashboard from '@components/dashboard/DepartmentDashboard';

/**
 * Fuel department home (FUEL_MANAGER).
 * Thin wrapper over the shared DepartmentDashboard template — the module key is
 * the only thing that differs between departments.
 */
const FuelDashboardScreen: React.FC = () => (
  <DepartmentDashboard module="fuel" />
);

export default FuelDashboardScreen;
