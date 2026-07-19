import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * System roles. Seeded idempotently on every run. `permissions` are
 * "<module>:<action>" strings; "*" grants everything (SUPER_ADMIN).
 * These names match the frontend Role union exactly.
 */
const ROLES: {
  name: string;
  label: string;
  permissions: string[];
  isSystem: boolean;
}[] = [
  { name: 'PUBLIC_USER', label: 'Citizen', permissions: [], isSystem: true },
  {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    permissions: ['*'],
    isSystem: true,
  },
  {
    name: 'MEDICINE_MANAGER',
    label: 'Medicine Department',
    permissions: ['medicine:view', 'medicine:manage'],
    isSystem: true,
  },
  {
    name: 'FUEL_MANAGER',
    label: 'Fuel Department',
    permissions: ['fuel:view', 'fuel:manage'],
    isSystem: true,
  },
  {
    name: 'WATER_MANAGER',
    label: 'Water Department',
    permissions: ['water:view', 'water:manage'],
    isSystem: true,
  },
  {
    name: 'ELECTRICITY_MANAGER',
    label: 'Electricity Department',
    permissions: ['electricity:view', 'electricity:manage'],
    isSystem: true,
  },
  {
    name: 'SCHEME_MANAGER',
    label: 'Scheme Department',
    permissions: ['scheme:view', 'scheme:manage'],
    isSystem: true,
  },
  {
    name: 'AREA_MANAGER',
    label: 'Area Intelligence Department',
    permissions: ['area:view', 'area:manage'],
    isSystem: true,
  },
];

/**
 * Departments — one per app module. `moduleKey` matches the frontend.
 * `managerRole` is the role name linked as the department's default role.
 */
const DEPARTMENTS: {
  name: string;
  label: string;
  moduleKey: string;
  managerRole: string;
}[] = [
  {
    name: 'MEDICINE',
    label: 'Medicines',
    moduleKey: 'medicine',
    managerRole: 'MEDICINE_MANAGER',
  },
  {
    name: 'FUEL',
    label: 'Fuel',
    moduleKey: 'fuel',
    managerRole: 'FUEL_MANAGER',
  },
  {
    name: 'WATER',
    label: 'Water',
    moduleKey: 'water',
    managerRole: 'WATER_MANAGER',
  },
  {
    name: 'ELECTRICITY',
    label: 'Electricity',
    moduleKey: 'electricity',
    managerRole: 'ELECTRICITY_MANAGER',
  },
  {
    name: 'SCHEME',
    label: 'Government Schemes',
    moduleKey: 'scheme',
    managerRole: 'SCHEME_MANAGER',
  },
  {
    name: 'AREA',
    label: 'Area Intelligence',
    moduleKey: 'area',
    managerRole: 'AREA_MANAGER',
  },
];

/**
 * Area Intelligence provider registry (docs/area-intelligence-architecture.md
 * §3/§8) — lets an admin toggle isActive/priority via
 * PATCH /api/v1/admin/areas/data-sources/:id without a redeploy.
 * `providerKey` matches each provider class's `.name` in code.
 */
const EXTERNAL_DATA_SOURCES: {
  providerKey: string;
  category:
    | 'GOVT'
    | 'MAPS'
    | 'TRAFFIC'
    | 'HEALTHCARE'
    | 'SCHOOL'
    | 'CRIME'
    | 'INTERNET'
    | 'WEATHER';
  displayName: string;
  priority: number;
}[] = [
  {
    providerKey: 'google-places',
    category: 'MAPS',
    displayName: 'Google Places (Nearby)',
    priority: 0,
  },
  {
    providerKey: 'osm',
    category: 'MAPS',
    displayName: 'OpenStreetMap (Overpass)',
    priority: 1,
  },
  {
    providerKey: 'google-traffic',
    category: 'TRAFFIC',
    displayName: 'Google Distance Matrix',
    priority: 0,
  },
  {
    providerKey: 'govt-crime',
    category: 'CRIME',
    displayName: 'data.gov.in / NCRB Crime Data',
    priority: 0,
  },
  {
    providerKey: 'govt-healthcare',
    category: 'HEALTHCARE',
    displayName: 'data.gov.in Health Facilities',
    priority: 0,
  },
  {
    providerKey: 'govt-school',
    category: 'SCHOOL',
    displayName: 'data.gov.in UDISE+ Schools',
    priority: 0,
  },
  {
    providerKey: 'trai',
    category: 'INTERNET',
    displayName: 'TRAI Broadband Open Data',
    priority: 0,
  },
];

async function main() {
  // Roles
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {
        label: r.label,
        permissions: r.permissions,
        isSystem: r.isSystem,
      },
      create: r,
    });
  }

  // Departments — created/updated and linked to their default manager role.
  for (const d of DEPARTMENTS) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: d.managerRole },
    });
    await prisma.department.upsert({
      where: { name: d.name },
      update: {
        label: d.label,
        moduleKey: d.moduleKey,
        defaultRoleId: role.id,
      },
      create: {
        name: d.name,
        label: d.label,
        moduleKey: d.moduleKey,
        defaultRoleId: role.id,
      },
    });
  }

  // Area Intelligence provider registry.
  for (const s of EXTERNAL_DATA_SOURCES) {
    await prisma.externalDataSource.upsert({
      where: { providerKey: s.providerKey },
      update: {
        category: s.category,
        displayName: s.displayName,
        priority: s.priority,
      },
      create: {
        providerKey: s.providerKey,
        category: s.category,
        displayName: s.displayName,
        priority: s.priority,
      },
    });
  }

  // Bootstrap super-admin so the admin APIs have a caller. Set SUPER_ADMIN_EMAIL
  // in .env; the user logs in via the normal Email OTP flow afterwards.
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (superAdminEmail) {
    const superRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'SUPER_ADMIN' },
    });
    await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: { roleId: superRole.id, isActive: true, isVerified: true },
      create: {
        email: superAdminEmail,
        isVerified: true,
        isActive: true,
        roleId: superRole.id,
      },
    });
    console.log(`✅ Super admin ensured: ${superAdminEmail}`);
  } else {
    console.log(
      'ℹ️  SUPER_ADMIN_EMAIL not set — skipped super-admin bootstrap.',
    );
  }

  console.log(
    `✅ Seeded ${ROLES.length} roles and ${DEPARTMENTS.length} departments (linked to manager roles).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
