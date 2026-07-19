import { BackgroundJobType } from '@prisma/client';

/** Single BullMQ queue for the whole module — job.name carries the
 * BackgroundJobType, dispatched by AreaIntelligenceProcessor. One queue (not
 * one per job type) means one worker pool to reason about/scale, matching the
 * existing codebase's low-infrastructure style; BullMQ already handles
 * per-job-type retry/backoff via each job's own options. */
export const AREA_INTELLIGENCE_QUEUE = 'area-intelligence';

/** Job names enqueued onto {@link AREA_INTELLIGENCE_QUEUE} — kept identical
 * to the BackgroundJobType enum so BackgroundJobLog.jobType can be set
 * directly from job.name. */
export const JOB_NAMES = {
  AREA_MASTER_SYNC: 'AREA_MASTER_SYNC',
  NEARBY_REFRESH: 'NEARBY_REFRESH',
  TRAFFIC_UPDATE: 'TRAFFIC_UPDATE',
  INTERNET_UPDATE: 'INTERNET_UPDATE',
  SCORE_RECALC: 'SCORE_RECALC',
  PROPERTY_STATS_UPDATE: 'PROPERTY_STATS_UPDATE',
  BUILDER_RATING_UPDATE: 'BUILDER_RATING_UPDATE',
  HISTORY_CLEANUP: 'HISTORY_CLEANUP',
} as const satisfies Record<BackgroundJobType, BackgroundJobType>;

/** Per-job-type retry policy (docs §7): more attempts for external-API-heavy
 * jobs, fewer for pure-DB jobs. */
export const JOB_ATTEMPTS: Record<BackgroundJobType, number> = {
  AREA_MASTER_SYNC: 2,
  NEARBY_REFRESH: 5,
  TRAFFIC_UPDATE: 5,
  INTERNET_UPDATE: 5,
  SCORE_RECALC: 2,
  PROPERTY_STATS_UPDATE: 2,
  BUILDER_RATING_UPDATE: 2,
  HISTORY_CLEANUP: 2,
};

export interface AreaJobData {
  /** Single area, or omitted for a bulk/global run. */
  areaId?: string;
  /** User who triggered this via the admin API, if any. */
  triggeredById?: string;
}
