import { Injectable } from '@nestjs/common';
import { Counter, Registry } from 'prom-client';
import { BackgroundJobType, JobStatus } from '@prisma/client';

/**
 * Job success/failure counters (docs §12) — a private Registry (not the
 * global `prom-client` default) so this module's metrics can't collide with
 * counters any other module registers under the same names later.
 */
@Injectable()
export class AreaMetricsService {
  private readonly registry = new Registry();
  private readonly jobsTotal = new Counter({
    name: 'area_intelligence_jobs_total',
    help: 'Area Intelligence background job outcomes',
    labelNames: ['jobType', 'status'] as const,
    registers: [this.registry],
  });

  recordJobOutcome(jobType: BackgroundJobType, status: JobStatus) {
    this.jobsTotal.inc({ jobType, status });
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
