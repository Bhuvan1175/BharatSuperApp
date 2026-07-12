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
  { name: 'SUPER_ADMIN', label: 'Super Admin', permissions: ['*'], isSystem: true },
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
  { name: 'MEDICINE', label: 'Medicines', moduleKey: 'medicine', managerRole: 'MEDICINE_MANAGER' },
  { name: 'FUEL', label: 'Fuel', moduleKey: 'fuel', managerRole: 'FUEL_MANAGER' },
  { name: 'WATER', label: 'Water', moduleKey: 'water', managerRole: 'WATER_MANAGER' },
  { name: 'ELECTRICITY', label: 'Electricity', moduleKey: 'electricity', managerRole: 'ELECTRICITY_MANAGER' },
  { name: 'SCHEME', label: 'Government Schemes', moduleKey: 'scheme', managerRole: 'SCHEME_MANAGER' },
  { name: 'AREA', label: 'Area Intelligence', moduleKey: 'area', managerRole: 'AREA_MANAGER' },
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
      update: { label: d.label, moduleKey: d.moduleKey, defaultRoleId: role.id },
      create: {
        name: d.name,
        label: d.label,
        moduleKey: d.moduleKey,
        defaultRoleId: role.id,
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
    console.log('ℹ️  SUPER_ADMIN_EMAIL not set — skipped super-admin bootstrap.');
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
