import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator';
import { AuthUser } from '../../strategies/jwt.strategy';

/**
 * PermissionsGuard
 *
 * Reads the permissions declared by @Permissions(...) and checks them against
 * the permissions on request.user (from the user's Role). Use it AFTER
 * JwtAuthGuard:
 *
 *   @UseGuards(JwtAuthGuard, PermissionsGuard)
 *   @Permissions('medicine:manage')
 *
 * The '*' wildcard (SUPER_ADMIN) grants everything. Routes without
 * @Permissions() are unaffected. Requires ALL listed permissions.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Permissions() on the route → nothing to enforce here.
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser }>();
    const permissions = user?.permissions ?? [];

    // Wildcard (super admin) grants everything.
    if (permissions.includes('*')) {
      return true;
    }

    const hasAll = required.every((p) => permissions.includes(p));
    if (!hasAll) {
      throw new ForbiddenException(
        'You do not have the required permission for this resource',
      );
    }

    return true;
  }
}
