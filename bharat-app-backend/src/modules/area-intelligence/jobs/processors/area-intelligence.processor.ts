import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BackgroundJobType } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AreaMasterService } from '../../area-master/area-master.service';
import { AreaDataCollectorService } from '../../collector/area-data-collector.service';
import { AreaScoringService } from '../../scoring/area-scoring.service';
import { AreaAiSummaryService } from '../../insights/area-ai-summary.service';
import { PropertyStatisticsService } from '../../property-stats/property-statistics.service';
import { AreaCacheService } from '../../cache/area-cache.service';
import { AreaMetricsService } from '../../metrics/area-metrics.service';
import { AREA_INTELLIGENCE_QUEUE, AreaJobData } from '../queues';

/** History rows older than this are pruned by HISTORY_CLEANUP (docs §7). */
const HISTORY_RETENTION_MONTHS = 24;

/**
 * Single worker for {@link AREA_INTELLIGENCE_QUEUE}. Dispatches by
 * `job.name` (== BackgroundJobType) rather than one WorkerHost per job type —
 * BullMQ ties one worker to one queue, so a single dispatching processor
 * avoids multiple workers racing over the same queue. Every run is wrapped in
 * a BackgroundJobLog row (RUNNING → SUCCESS/FAILED), never silently dropped
 * (docs §7).
 */
@Processor(AREA_INTELLIGENCE_QUEUE)
export class AreaIntelligenceProcessor extends WorkerHost {
  private readonly logger = new Logger(AreaIntelligenceProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly areaMaster: AreaMasterService,
    private readonly collector: AreaDataCollectorService,
    private readonly scoring: AreaScoringService,
    private readonly aiSummary: AreaAiSummaryService,
    private readonly propertyStats: PropertyStatisticsService,
    private readonly cache: AreaCacheService,
    private readonly metrics: AreaMetricsService,
  ) {
    super();
  }

  async process(job: Job<AreaJobData>): Promise<number> {
    const jobType = job.name as BackgroundJobType;
    const log = await this.prisma.backgroundJobLog.create({
      data: {
        jobType,
        areaId: job.data.areaId,
        triggeredById: job.data.triggeredById,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
    // Structured fields (jobId/areaId/jobType), not string interpolation —
    // needed to debug one area's failed sync without grepping (docs §12).
    const context = { jobLogId: log.id, jobType, areaId: job.data.areaId };

    try {
      const recordsProcessed = await this.dispatch(jobType, job.data);
      await this.prisma.backgroundJobLog.update({
        where: { id: log.id },
        data: { status: 'SUCCESS', recordsProcessed, finishedAt: new Date() },
      });
      this.metrics.recordJobOutcome(jobType, 'SUCCESS');
      this.logger.log({ ...context, recordsProcessed, msg: 'Job succeeded' });
      return recordsProcessed;
    } catch (e) {
      const message = (e as Error).message;
      this.logger.error({ ...context, error: message, msg: 'Job failed' });
      await this.prisma.backgroundJobLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          errorMessage: message,
          finishedAt: new Date(),
        },
      });
      this.metrics.recordJobOutcome(jobType, 'FAILED');
      throw e;
    }
  }

  private async dispatch(
    jobType: BackgroundJobType,
    data: AreaJobData,
  ): Promise<number> {
    switch (jobType) {
      case 'AREA_MASTER_SYNC':
        return this.areaMaster.syncFromLocalities();

      case 'NEARBY_REFRESH':
        return this.forOneOrAllAreas(data.areaId, async (areaId) => {
          const count = await this.collector.collectNearby(areaId);
          await this.cache.invalidateArea(areaId);
          return count;
        });

      case 'TRAFFIC_UPDATE':
      case 'INTERNET_UPDATE':
        return this.forOneOrAllAreas(data.areaId, async (areaId) => {
          const count = await this.collector.collectStatistics(areaId);
          await this.cache.invalidateArea(areaId);
          return count;
        });

      case 'SCORE_RECALC':
        return this.forOneOrAllAreas(data.areaId, async (areaId) => {
          await this.scoring.recomputeArea(areaId);
          // Always runs now — generateAndSave itself falls back to a
          // rule-based summary from real data when no OPENAI_API_KEY is set,
          // instead of leaving citizens with a permanent placeholder.
          await this.aiSummary.generateAndSave(areaId);
          await this.cache.invalidateArea(areaId);
          return 1;
        });

      case 'PROPERTY_STATS_UPDATE':
        return this.forOneOrAllAreas(data.areaId, () =>
          this.propertyStats.recomputeForArea(),
        );

      case 'BUILDER_RATING_UPDATE':
        // No-op stub until the Property module exists (docs §7, §12).
        return 0;

      case 'HISTORY_CLEANUP':
        return this.cleanupHistory();

      default:
        this.logger.warn(`Unknown job type: ${jobType as string}`);
        return 0;
    }
  }

  /** Runs `fn` for one area, or every area when `areaId` is omitted (bulk run). */
  private async forOneOrAllAreas(
    areaId: string | undefined,
    fn: (areaId: string) => Promise<number>,
  ): Promise<number> {
    const ids = areaId ? [areaId] : await this.areaMaster.allAreaIds();
    let total = 0;
    for (const id of ids) {
      total += await fn(id);
    }
    return total;
  }

  private async cleanupHistory(): Promise<number> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - HISTORY_RETENTION_MONTHS);
    const result = await this.prisma.areaHistory.deleteMany({
      where: { snapshotAt: { lt: cutoff } },
    });
    return result.count;
  }
}
