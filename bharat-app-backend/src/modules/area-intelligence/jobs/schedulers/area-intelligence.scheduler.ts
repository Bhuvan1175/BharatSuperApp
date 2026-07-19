import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { AREA_INTELLIGENCE_QUEUE, JOB_ATTEMPTS, JOB_NAMES } from '../queues';

const IST = { timeZone: 'Asia/Kolkata' };

/**
 * Cron triggers that enqueue background jobs (docs §7). Every method only
 * enqueues — the actual work (and its retry/backoff) happens in
 * AreaIntelligenceProcessor, so a slow external call never blocks the
 * scheduler tick.
 */
@Injectable()
export class AreaIntelligenceScheduler {
  private readonly logger = new Logger(AreaIntelligenceScheduler.name);

  constructor(
    @InjectQueue(AREA_INTELLIGENCE_QUEUE) private readonly queue: Queue,
  ) {}

  private enqueue(jobName: keyof typeof JOB_NAMES) {
    return this.queue.add(
      jobName,
      {},
      {
        attempts: JOB_ATTEMPTS[jobName],
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  /** Weekly — reconciles new Locality rows into AreaMaster. */
  @Cron('0 2 * * 0', IST)
  async areaMasterSync() {
    this.logger.log('Enqueuing weekly Area Master Sync');
    await this.enqueue('AREA_MASTER_SYNC');
  }

  /** Weekly, staggered — nearby places refresh for every area. */
  @Cron('0 3 * * 1', IST)
  async nearbyRefresh() {
    this.logger.log('Enqueuing weekly Nearby Places Refresh');
    await this.enqueue('NEARBY_REFRESH');
  }

  /** Every 30 minutes — traffic is the most time-sensitive signal. */
  @Cron('*/30 * * * *')
  async trafficUpdate() {
    await this.enqueue('TRAFFIC_UPDATE');
  }

  /** Weekly — internet availability changes slowly. */
  @Cron('0 3 * * 2', IST)
  async internetUpdate() {
    this.logger.log('Enqueuing weekly Internet Availability Update');
    await this.enqueue('INTERNET_UPDATE');
  }

  /** Nightly full sweep — score + AI summary recompute for every area. */
  @Cron('30 2 * * *', IST)
  async scoreRecalc() {
    this.logger.log('Enqueuing nightly Score Recalculation');
    await this.enqueue('SCORE_RECALC');
  }

  /** Nightly — no-op stub until the Property module exists. */
  @Cron('0 1 * * *', IST)
  async propertyStatsUpdate() {
    await this.enqueue('PROPERTY_STATS_UPDATE');
  }

  /** Nightly — same stub caveat as Property Statistics. */
  @Cron('15 1 * * *', IST)
  async builderRatingUpdate() {
    await this.enqueue('BUILDER_RATING_UPDATE');
  }

  /** Monthly — prunes AreaHistory beyond the retention window. */
  @Cron('0 4 1 * *', IST)
  async historyCleanup() {
    this.logger.log('Enqueuing monthly History Cleanup');
    await this.enqueue('HISTORY_CLEANUP');
  }
}
