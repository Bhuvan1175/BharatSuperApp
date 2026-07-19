import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../../redis/redis.service';

/** TTLs in seconds, per docs/area-intelligence-architecture.md §9. */
const TTL = {
  detail: 6 * 60 * 60,
  intelligence: 6 * 60 * 60,
  nearby: 24 * 60 * 60,
  propertyStats: 60 * 60,
  summary: 12 * 60 * 60,
  search: 5 * 60,
  compare: 5 * 60,
  activeProviders: 60,
} as const;

/**
 * Typed JSON wrapper around the existing bare RedisService (get/set/del) —
 * matches the codebase's low-abstraction style (explicit service calls, no
 * decorator/interceptor magic). Read path: cache-first, DB fallback on miss.
 * Write path: recompute jobs call the `set*` methods directly (cache-aside
 * AND warm-on-write, since the job just computed the fresh value).
 */
@Injectable()
export class AreaCacheService {
  constructor(private readonly redis: RedisService) {}

  private async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private setJson(key: string, value: unknown, ttlSeconds: number) {
    return this.redis.set(key, JSON.stringify(value), ttlSeconds);
  }

  /** Deterministic short hash for query-derived cache keys (search/compare). */
  private hash(input: unknown): string {
    return createHash('sha1')
      .update(JSON.stringify(input))
      .digest('hex')
      .slice(0, 16);
  }

  getDetail<T>(areaId: string) {
    return this.getJson<T>(`area:${areaId}:detail`);
  }
  setDetail(areaId: string, value: unknown) {
    return this.setJson(`area:${areaId}:detail`, value, TTL.detail);
  }

  getIntelligence<T>(areaId: string) {
    return this.getJson<T>(`area:${areaId}:intelligence`);
  }
  setIntelligence(areaId: string, value: unknown) {
    return this.setJson(`area:${areaId}:intelligence`, value, TTL.intelligence);
  }

  getNearby<T>(areaId: string) {
    return this.getJson<T>(`area:${areaId}:nearby`);
  }
  setNearby(areaId: string, value: unknown) {
    return this.setJson(`area:${areaId}:nearby`, value, TTL.nearby);
  }

  getPropertyStats<T>(areaId: string) {
    return this.getJson<T>(`area:${areaId}:property-stats`);
  }
  setPropertyStats(areaId: string, value: unknown) {
    return this.setJson(
      `area:${areaId}:property-stats`,
      value,
      TTL.propertyStats,
    );
  }

  getSummary<T>(areaId: string) {
    return this.getJson<T>(`area:${areaId}:summary`);
  }
  setSummary(areaId: string, value: unknown) {
    return this.setJson(`area:${areaId}:summary`, value, TTL.summary);
  }

  getSearch<T>(query: unknown) {
    return this.getJson<T>(`area:search:${this.hash(query)}`);
  }
  setSearch(query: unknown, value: unknown) {
    return this.setJson(`area:search:${this.hash(query)}`, value, TTL.search);
  }

  getCompare<T>(areaIds: string[]) {
    return this.getJson<T>(`area:compare:${this.hash([...areaIds].sort())}`);
  }
  setCompare(areaIds: string[], value: unknown) {
    return this.setJson(
      `area:compare:${this.hash([...areaIds].sort())}`,
      value,
      TTL.compare,
    );
  }

  getActiveProviders<T>(category: string) {
    return this.getJson<T>(`datasource:active-providers:${category}`);
  }
  setActiveProviders(category: string, value: unknown) {
    return this.setJson(
      `datasource:active-providers:${category}`,
      value,
      TTL.activeProviders,
    );
  }

  /** Invalidates every cache entry tied to one area (score/insight recompute). */
  async invalidateArea(areaId: string) {
    await Promise.all([
      this.redis.del(`area:${areaId}:detail`),
      this.redis.del(`area:${areaId}:intelligence`),
      this.redis.del(`area:${areaId}:nearby`),
      this.redis.del(`area:${areaId}:property-stats`),
      this.redis.del(`area:${areaId}:summary`),
    ]);
  }

  invalidateActiveProviders(category: string) {
    return this.redis.del(`datasource:active-providers:${category}`);
  }
}
