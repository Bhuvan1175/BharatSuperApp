import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Shape of the decoded JWT payload.
 * Adjust these fields to match whatever you sign at login time.
 */
export interface JwtPayload {
  sub: string; // user id
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * JwtStrategy
 *
 * Registered under the name 'jwt' (the default for passport-jwt), so
 * AuthGuard('jwt') / JwtAuthGuard resolves to this strategy.
 *
 * It:
 *   1. Extracts the token from the "Authorization: Bearer <token>" header.
 *   2. Verifies the signature and expiry using JWT_SECRET.
 *   3. Returns the object that becomes `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ?? 'change-me-in-env',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Whatever is returned here is attached to request.user.
    // Add a DB lookup here if you need the full user record.
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}