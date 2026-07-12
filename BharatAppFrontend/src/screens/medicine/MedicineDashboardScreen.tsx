import React from 'react';
import DepartmentDashboard from '@components/dashboard/DepartmentDashboard';

/**
 * Medicine department home (MEDICINE_MANAGER).
 * Thin wrapper over the shared DepartmentDashboard template — the module key is
 * the only thing that differs between departments.
 */
const MedicineDashboardScreen: React.FC = () => (
  <DepartmentDashboard module="medicine" />
);

export default MedicineDashboardScreen;
