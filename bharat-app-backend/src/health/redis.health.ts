import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

/** Round-trips a value through the existing RedisService (set/get) — also
 * exercises the same Redis instance BullMQ workers connect to, so a failure
 * here means both caching and background jobs are degraded. */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private static readonly PING_KEY = 'health:ping';

  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redis.set(RedisHealthIndicator.PING_KEY, 'ok', 5);
      const value = await this.redis.get(RedisHealthIndicator.PING_KEY);
      if (value !== 'ok')
        throw new Error('Unexpected value read back from Redis');
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { message: (e as Error).message }),
      );
    }
  }
}
