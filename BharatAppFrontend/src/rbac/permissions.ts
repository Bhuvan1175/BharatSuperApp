/**
 * Pure helper functions for asking RBAC questions. No React, no navigation —
 * safe to use in the store, guards, screens and unit tests alike.
 */
import {DEFAULT_ROLE, ROLE_CONFIG} from './roles';
import {
  DashboardRoute,
  ModuleKey,
  Permission,
  Role,
  RoleConfig,
} from './types';

/** Full static config for a role. */
export const getRoleConfig = (role: Role): RoleConfig => ROLE_CONFIG[role];

/** The dashboard a role opens after login. */
export const getDashboardForRole = (role: Role): DashboardRoute =>
  ROLE_CONFIG[role].dashboard;

/** True for department managers (not citizen / super-admin). */
export const isDepartmentRole = (role: Role): boolean =>
  ROLE_CONFIG[role].isDepartment;

/** Does this role hold a permission? Wildcard `*` grants everything. */
export const hasPermission = (role: Role, permission: Permission): boolean => {
  const {permissions} = ROLE_CONFIG[role];
  return permissions.includes('*') || permissions.includes(permission);
};

/** Can this role view a module's public information? */
export const canViewModule = (role: Role, module: ModuleKey): boolean =>
  hasPermission(role, `${module}:view`);

/** Can this role manage (edit / publish) a module? */
export const canManageModule = (role: Role, module: ModuleKey): boolean =>
  hasPermission(role, `${module}:manage`);

/** Modules this role may enter (drives navigation + guards). */
export const getAccessibleModules = (role: Role): ModuleKey[] =>
  ROLE_CONFIG[role].modules;

/**
 * Map a raw role string (e.g. from a JWT claim) to a known Role. Unknown or
 * missing values fall back to the least-privilege default. THIS is the single
 * function you point at the backend in Step 10 — nothing else changes.
 */
export const normalizeRole = (raw?: string | null): Role =>
  raw && raw in ROLE_CONFIG ? (raw as Role) : DEFAULT_ROLE;
