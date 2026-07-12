import React from 'react';
import DepartmentDashboard from '@components/dashboard/DepartmentDashboard';

/**
 * Electricity department home (ELECTRICITY_MANAGER).
 * Thin wrapper over the shared DepartmentDashboard template — the module key is
 * the only thing that differs between departments.
 */
const ElectricityDashboardScreen: React.FC = () => (
  <DepartmentDashboard module="electricity" />
);

export default ElectricityDashboardScreen;
