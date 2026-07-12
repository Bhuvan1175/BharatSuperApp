# RBAC (Role-Based Access Control) — frontend

Single source of truth for roles, permissions, departments and dashboards.
Backend RBAC is **not** implemented yet; the app runs on a mock role until it is.

## Files

| File | Purpose |
|---|---|
| `types.ts` | Pure types: `Role`, `ModuleKey`, `Department`, `Permission`, `DashboardRoute`, `RoleConfig`, `ModuleConfig`. |
| `roles.ts` | `MODULES` catalogue + `ROLE_CONFIG` registry + `ALL_ROLES`, `ALL_MODULES`, `DEFAULT_ROLE`. **Edit this to add a role or module.** |
| `permissions.ts` | Pure helpers: `hasPermission`, `canViewModule`, `canManageModule`, `getDashboardForRole`, `normalizeRole`, … |
| `mockRole.ts` | `USE_MOCK_ROLE` + `MOCK_ROLE` — the temporary role source. |

## Roles

`PUBLIC_USER` (citizen, view-only), `SUPER_ADMIN` (wildcard `*`), and one manager
per module: `MEDICINE_MANAGER`, `FUEL_MANAGER`, `WATER_MANAGER`,
`ELECTRICITY_MANAGER`, `SCHEME_MANAGER`, `AREA_MANAGER`.

## How a role becomes a dashboard

```
login / bootstrap
      → authStore.resolveRole(user)         // mock now, JWT later
      → store.role  (+ department, permissions)
      → useRole()                            // the ONLY role accessor
      → RoleRouter → getRoleConfig(role).dashboard → DASHBOARD_REGISTRY[…]
```

`RoleGuard` and `usePermissions` read the same `useRole()`, so nothing branches
on hardcoded role names.

## Going live with backend RBAC (the only change needed)

1. Backend includes a `role` claim on the user (JWT or `GET /users/profile`).
   The frontend `ApiUser` type already has an optional `role?: string`.
2. In `mockRole.ts`, set `USE_MOCK_ROLE = false`.

Done. `resolveRole()` then reads `normalizeRole(user.role)`. Unknown/missing
values fall back to `PUBLIC_USER` (least privilege). **No screens, navigation,
guards or components change.**

## Adding a new module (e.g. Transport)

1. `types.ts`: add `'transport'` to `ModuleKey`, `'TRANSPORT'` to `Department`,
   `'TransportDashboard'` to `DashboardRoute`, `'TRANSPORT_MANAGER'` to `Role`.
2. `roles.ts`: one `MODULES` entry + one `ROLE_CONFIG` entry.
3. `screens/transport/`: a 3-line dashboard wrapper over `DepartmentDashboard`.
4. `RoleRouter`: one line in `DASHBOARD_REGISTRY`.

No existing code is touched.

## Dev role switcher

In dev builds (`__DEV__`), a floating button on any dashboard opens a role
picker (`components/dashboard/DevRoleSwitcher.tsx`) that calls
`authStore.setRole()` to preview any dashboard instantly. It is never rendered
in release builds.
