import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../auth/strategies/jwt.strategy';
import { AreaCacheService } from './cache/area-cache.service';
import { AreaMetricsService } from './metrics/area-metrics.service';
import {
  AREA_INTELLIGENCE_QUEUE,
  AreaJobData,
  JOB_ATTEMPTS,
} from './jobs/queues';
import { QueryJobsDto, UpdateDataSourceDto } from './dto/admin-job.dto';

/**
 * Admin surface (`/admin/areas/*`, docs §4). Every mutation enqueues a
 * BullMQ job and returns immediately with a jobId — never blocks an HTTP
 * request on an external-data call (same reasoning as
 * LocationService.createDistrict's fire-and-forget autoFetchCities,
 * generalized here into a real queue).
 */
@Injectable()
export class AreaAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AreaCacheService,
    private readonly metrics: AreaMetricsService,
    @InjectQueue(AREA_INTELLIGENCE_QUEUE) private readonly queue: Queue,
  ) {}

  private async enqueue(jobName: string, data: AreaJobData) {
    const attempts = JOB_ATTEMPTS[jobName as keyof typeof JOB_ATTEMPTS] ?? 3;
    const job = await this.queue.add(jobName, data, {
      attempts,
      backoff: { type: 'exponential', delay: 5000 },
    });
    return { jobId: job.id };
  }

  syncAreaMaster(user: AuthUser) {
    return this.enqueue('AREA_MASTER_SYNC', { triggeredById: user.userId });
  }

  async refresh(user: AuthUser, areaId?: string) {
    const [nearby, stats] = await Promise.all([
      this.enqueue('NEARBY_REFRESH', { areaId, triggeredById: user.userId }),
      this.enqueue('TRAFFIC_UPDATE', { areaId, triggeredById: user.userId }),
    ]);
    return { nearbyJobId: nearby.jobId, statsJobId: stats.jobId };
  }

  recalculate(user: AuthUser, areaId?: string) {
    return this.enqueue('SCORE_RECALC', { areaId, triggeredById: user.userId });
  }

  listJobs(query: QueryJobsDto) {
    return this.prisma.backgroundJobLog.findMany({
      where: { jobType: query.jobType, status: query.status },
      orderBy: { startedAt: 'desc' },
      take: query.limit ?? 50,
    });
  }

  listDataSources() {
    return this.prisma.externalDataSource.findMany({
      orderBy: [{ category: 'asc' }, { priority: 'asc' }],
    });
  }

  async updateDataSource(id: string, dto: UpdateDataSourceDto) {
    const source = await this.prisma.externalDataSource.update({
      where: { id },
      data: { isActive: dto.isActive, priority: dto.priority },
    });
    await this.cache.invalidateActiveProviders(source.category);
    return source;
  }

  /** Prometheus-format job outcome counters (docs §12). Gated the same as
   * every other admin route (AREA_MANAGER/SUPER_ADMIN) — this app has no
   * network-level "internal-only" boundary, so RBAC is the closest existing
   * equivalent; a Prometheus scrape config would need a bearer token. */
  metricsText() {
    return this.metrics.metrics();
  }
}
