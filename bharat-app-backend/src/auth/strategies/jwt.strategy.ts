import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Shape of the decoded JWT payload. `role` and `department` are the role/
 * department NAMES signed at login (see AuthService.verifyOtp).
 */
export interface JwtPayload {
  sub: string; // user id
  email?: string;
  role?: string | null;
  department?: string | null;
  iat?: number;
  exp?: number;
}

/**
 * The RBAC context attached to `request.user` for every authenticated request.
 * Guards (@Roles / @Permissions) and @CurrentUser() read from this.
 */
export interface AuthUser {
  userId: string;
  email: string | null;
  role: string | null;
  department: string | null;
  permissions: string[];
  isActive: boolean;
}

/**
 * JwtStrategy
 *
 * Registered under the name 'jwt', so AuthGuard('jwt') / JwtAuthGuard resolves
 * to this strategy.
 *
 * It:
 *   1. Extracts the token from "Authorization: Bearer <token>".
 *   2. Verifies signature + expiry using JWT_SECRET.
 *   3. Loads the user's CURRENT role/department/permissions from the DB and
 *      rejects deactivated accounts — so role changes and deactivations take
 *      effect immediately, not only after the 15-minute access token expires.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ?? 'change-me-in-env',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Fresh RBAC context from the DB (source of truth), not the token claims.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true, department: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role?.name ?? null,
      department: user.department?.name ?? null,
      permissions: user.role?.permissions ?? [],
      isActive: user.isActive,
    };
  }
}
