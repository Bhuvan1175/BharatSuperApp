import { SetMetadata } from '@nestjs/common';

/** Metadata key under which required roles are stored. */
export const ROLES_KEY = 'roles';

/**
 * @Roles('MEDICINE_MANAGER', 'SUPER_ADMIN')
 *
 * Marks a route (or controller) as requiring one of the listed role names.
 * Enforced by RolesGuard. Role names are the same strings seeded in the DB and
 * carried on the JWT (e.g. 'MEDICINE_MANAGER').
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
