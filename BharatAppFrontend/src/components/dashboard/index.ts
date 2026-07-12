/**
 * Reusable dashboard building blocks shared by EVERY role's dashboard, so no
 * dashboard reimplements layout primitives. EmptyState is re-exported from
 * components/common (reused, never duplicated).
 */
export {default as DashboardCard} from './DashboardCard';
export {default as StatisticsCard} from './StatisticsCard';
export {default as ModuleCard} from './ModuleCard';
export {default as QuickActionCard} from './QuickActionCard';
export {default as LoadingState} from './LoadingState';
export {default as ErrorState} from './ErrorState';
export {default as DepartmentDashboard} from './DepartmentDashboard';
export {default as DevRoleSwitcher} from './DevRoleSwitcher';
export {EmptyState} from '@components/common';
