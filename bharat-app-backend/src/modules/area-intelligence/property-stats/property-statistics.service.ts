import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Stub until a Property module exists (docs §1, §3). Keys on `areaId` alone —
 * no Property/Builder FK yet. The nightly Property Statistics Update /
 * Builder Rating Update jobs call these as no-ops today; once a Property
 * module ships, this service is extended to actually aggregate from it and
 * `BuilderRating.builderName` is upgraded to a real FK.
 */
@Injectable()
export class PropertyStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  getForArea(areaId: string) {
    return this.prisma.propertyStatistics.findUnique({ where: { areaId } });
  }

  getPriceHistory(areaId: string) {
    return this.prisma.priceHistory.findMany({
      where: { areaId },
      orderBy: { period: 'asc' },
    });
  }

  getBuilderRatings(areaId: string) {
    return this.prisma.builderRating.findMany({ where: { areaId } });
  }

  /** No-op until the Property module exists — returns 0 rows touched. Takes
   * no area id yet since there's nothing area-specific to compute. */
  recomputeForArea(): Promise<number> {
    return Promise.resolve(0);
  }
}
