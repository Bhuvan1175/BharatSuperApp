import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

/**
 * GET /health — unauthenticated (no @UseGuards), matching standard practice
 * for load-balancer/uptime-monitor health checks. Not present anywhere in the
 * codebase before this (docs/area-intelligence-architecture.md §12 flagged
 * the gap, surfaced by Area Intelligence's job-heavy surface).
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      // Also verifies the Redis instance BullMQ workers connect to.
      () => this.redisIndicator.isHealthy('redis'),
    ]);
  }
}
