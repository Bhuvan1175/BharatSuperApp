import React from 'react';
import DepartmentDashboard from '@components/dashboard/DepartmentDashboard';

/**
 * Scheme department home (SCHEME_MANAGER).
 * Thin wrapper over the shared DepartmentDashboard template — the module key is
 * the only thing that differs between departments.
 */
const SchemeDashboardScreen: React.FC = () => (
  <DepartmentDashboard module="scheme" />
);

export default SchemeDashboardScreen;
