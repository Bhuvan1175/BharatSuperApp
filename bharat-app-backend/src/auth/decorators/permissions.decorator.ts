import { SetMetadata } from '@nestjs/common';

/** Metadata key under which required permissions are stored. */
export const PERMISSIONS_KEY = 'permissions';

/**
 * @Permissions('medicine:manage')
 *
 * Marks a route (or controller) as requiring ALL of the listed permission
 * strings. Enforced by PermissionsGuard. Permissions are the "<module>:<action>"
 * strings stored on the user's Role; the '*' wildcard (SUPER_ADMIN) grants all.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
