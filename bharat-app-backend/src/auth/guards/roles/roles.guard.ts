import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { AuthUser } from '../../strategies/jwt.strategy';

/**
 * RolesGuard
 *
 * Reads the roles declared by @Roles(...) and checks them against the role on
 * request.user (populated by JwtStrategy). Use it AFTER JwtAuthGuard:
 *
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('MEDICINE_MANAGER')
 *
 * SUPER_ADMIN bypasses every role check (full oversight). Routes without
 * @Roles() are unaffected.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() on the route → nothing to enforce here.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser }>();

    if (!user?.role) {
      throw new ForbiddenException('No role assigned to this account');
    }

    // Super admin can access any role-gated route.
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have the required role for this resource',
      );
    }

    return true;
  }
}
