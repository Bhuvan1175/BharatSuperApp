/**
 * RBAC type layer — the single source of truth for roles, permissions,
 * departments and dashboards across the Bharat Super App frontend.
 *
 * These are PURE TYPES with zero React / navigation imports, so they can be
 * imported anywhere (store, guards, screens, tests) without creating cycles.
 *
 * Backend note: when NestJS RBAC lands, the JWT's `role` claim maps 1:1 onto
 * the `Role` union below. Nothing else in this file needs to change.
 */

/** Every role the app understands. Extend this union to add a new role. */
export type Role =
  | 'PUBLIC_USER'
  | 'SUPER_ADMIN'
  | 'MEDICINE_MANAGER'
  | 'FUEL_MANAGER'
  | 'WATER_MANAGER'
  | 'ELECTRICITY_MANAGER'
  | 'SCHEME_MANAGER'
  | 'AREA_MANAGER';

/** A functional module of the super app. Add a key to add a module. */
export type ModuleKey =
  | 'medicine'
  | 'fuel'
  | 'water'
  | 'electricity'
  | 'scheme'
  | 'area';

/** Department that owns a module. Public/Admin belong to no single dept. */
export type Department =
  | 'MEDICINE'
  | 'FUEL'
  | 'WATER'
  | 'ELECTRICITY'
  | 'SCHEME'
  | 'AREA';

/** What a role is allowed to do with a module. */
export type PermissionAction = 'view' | 'manage';

/**
 * A permission string, e.g. `medicine:view` or `fuel:manage`.
 * `*` is the wildcard held only by SUPER_ADMIN.
 */
export type Permission = `${ModuleKey}:${PermissionAction}` | '*';

/** Navigation target names for each role's home surface (wired in Step 3). */
export type DashboardRoute =
  | 'CitizenDashboard'
  | 'AdminDashboard'
  | 'MedicineDashboard'
  | 'FuelDashboard'
  | 'WaterDashboard'
  | 'ElectricityDashboard'
  | 'SchemeDashboard'
  | 'AreaDashboard';

/** Static description of a single role. */
export interface RoleConfig {
  role: Role;
  /** Human label shown in UI (dashboards, role switcher). */
  label: string;
  /** One-line description of what this role does. */
  description: string;
  /** Owning department, or null for citizen / super-admin. */
  department: Department | null;
  /** True for module managers; false for PUBLIC_USER and SUPER_ADMIN. */
  isDepartment: boolean;
  /** The dashboard this role opens after login. */
  dashboard: DashboardRoute;
  /** Flat list of permissions granted to this role. */
  permissions: Permission[];
  /** Modules this role may enter. */
  modules: ModuleKey[];
}

/** Static metadata for a module (labels, icon, colour, owning dept). */
export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  description: string;
  /** react-native-vector-icons (Feather) name. */
  icon: string;
  /** Accent colour for cards. */
  color: string;
  department: Department;
}
