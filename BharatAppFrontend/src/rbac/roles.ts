/**
 * The role & module registry — the data behind the RBAC types.
 *
 * To add a new department module you touch ONLY this file (plus adding the
 * string literals to ./types): register the module in MODULES and the role in
 * ROLE_CONFIG. Navigation, guards and the store all read from here — so there
 * is exactly one place to change.
 */
import {
  Department,
  ModuleConfig,
  ModuleKey,
  Permission,
  Role,
  RoleConfig,
} from './types';

/** Central module catalogue. Drives citizen cards and the admin grid. */
export const MODULES: Record<ModuleKey, ModuleConfig> = {
  medicine: {
    key: 'medicine',
    label: 'Medicines',
    description: 'Pharmacies, stock & generic alternatives',
    icon: 'heart',
    color: '#E5484D',
    department: 'MEDICINE',
  },
  fuel: {
    key: 'fuel',
    label: 'Fuel',
    description: 'Petrol, CNG & EV stations near you',
    icon: 'truck',
    color: '#F76B15',
    department: 'FUEL',
  },
  water: {
    key: 'water',
    label: 'Water',
    description: 'Supply schedules & outage alerts',
    icon: 'droplet',
    color: '#0091FF',
    department: 'WATER',
  },
  electricity: {
    key: 'electricity',
    label: 'Electricity',
    description: 'Power cuts, billing & load-shedding',
    icon: 'zap',
    color: '#F5A623',
    department: 'ELECTRICITY',
  },
  scheme: {
    key: 'scheme',
    label: 'Government Schemes',
    description: 'Eligibility & applications',
    icon: 'award',
    color: '#30A46C',
    department: 'SCHEME',
  },
  area: {
    key: 'area',
    label: 'Area Intelligence',
    description: 'Liveability scores & local insights',
    icon: 'map-pin',
    color: '#8E4EC6',
    department: 'AREA',
  },
};

/** Convenience: every module key, in display order. */
export const ALL_MODULES: ModuleKey[] = Object.keys(MODULES) as ModuleKey[];

/** Builds a department manager's config with minimal repetition. */
const departmentManager = (
  role: Role,
  label: string,
  department: Department,
  module: ModuleKey,
  dashboard: RoleConfig['dashboard'],
): RoleConfig => ({
  role,
  label,
  description: `Manages the ${MODULES[module].label} module`,
  department,
  isDepartment: true,
  dashboard,
  permissions: [`${module}:view`, `${module}:manage`],
  modules: [module],
});

/**
 * The role registry. Every supported role is described here exactly once.
 * Adding a role = adding one entry (and its literal in ./types).
 */
export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  PUBLIC_USER: {
    role: 'PUBLIC_USER',
    label: 'Citizen',
    description: 'Views information across all public modules',
    department: null,
    isDepartment: false,
    dashboard: 'CitizenDashboard',
    permissions: ALL_MODULES.map((m): Permission => `${m}:view`),
    modules: ALL_MODULES,
  },
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Full oversight of every department and module',
    department: null,
    isDepartment: false,
    dashboard: 'AdminDashboard',
    permissions: ['*'],
    modules: ALL_MODULES,
  },
  MEDICINE_MANAGER: departmentManager(
    'MEDICINE_MANAGER',
    'Medicine Department',
    'MEDICINE',
    'medicine',
    'MedicineDashboard',
  ),
  FUEL_MANAGER: departmentManager(
    'FUEL_MANAGER',
    'Fuel Department',
    'FUEL',
    'fuel',
    'FuelDashboard',
  ),
  WATER_MANAGER: departmentManager(
    'WATER_MANAGER',
    'Water Department',
    'WATER',
    'water',
    'WaterDashboard',
  ),
  ELECTRICITY_MANAGER: departmentManager(
    'ELECTRICITY_MANAGER',
    'Electricity Department',
    'ELECTRICITY',
    'electricity',
    'ElectricityDashboard',
  ),
  SCHEME_MANAGER: departmentManager(
    'SCHEME_MANAGER',
    'Scheme Department',
    'SCHEME',
    'scheme',
    'SchemeDashboard',
  ),
  AREA_MANAGER: departmentManager(
    'AREA_MANAGER',
    'Area Intelligence Department',
    'AREA',
    'area',
    'AreaDashboard',
  ),
};

/** Runtime list of all roles (used by the mock role switcher in Step 9). */
export const ALL_ROLES: Role[] = Object.keys(ROLE_CONFIG) as Role[];

/** The role assumed when none is known (safe, least-privilege default). */
export const DEFAULT_ROLE: Role = 'PUBLIC_USER';
