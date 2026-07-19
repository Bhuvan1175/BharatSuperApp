import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AreaScoreCategory } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AreaScoringEngine } from './area-scoring.engine';
import { CategoryScoreInput } from './area-scoring.types';
import { computeSafetyInputs } from './category-scorers/safety.scorer';
import { computeTrafficInputs } from './category-scorers/traffic.scorer';
import { computeHealthcareInputs } from './category-scorers/healthcare.scorer';
import { computeSchoolInputs } from './category-scorers/school.scorer';
import { computeInternetInputs } from './category-scorers/internet.scorer';
import { computeUtilitiesInputs } from './category-scorers/utilities.scorer';

/** Current scoring-engine version, stamped on every AreaScoreSnapshot. Bump
 * this whenever the weighting/normalization logic changes materially, so old
 * snapshots stay attributable to the formula that produced them. */
export const SCORING_ENGINE_VERSION = '1.0.0';

/** Fixed category weights for the overall-score rollup (docs §5). */
const CATEGORY_WEIGHTS: Record<AreaScoreCategory, number> = {
  SAFETY: 0.25,
  TRAFFIC: 0.15,
  HEALTHCARE: 0.2,
  SCHOOL: 0.2,
  INTERNET: 0.1,
  UTILITIES: 0.1,
};

/** `AreaStatistic.statKey` values this scoring pass reads. Written by the
 * Data Collector (one row per key, latest `asOfDate` wins). */
const STAT_KEYS = [
  'crime_rate_per_1000',
  'incident_reports_per_month',
  'avg_commute_min',
  'congestion_index',
  'beds_per_thousand',
  'pupil_teacher_ratio',
  'avg_download_mbps',
  'broadband_penetration_pct',
  'water_supply_hours_per_day',
  'power_outages_per_month',
] as const;

/**
 * I/O wrapper around {@link AreaScoringEngine}: loads an area's raw inputs
 * (AreaStatistic rows + nearby-amenity counts), calls the pure engine, and
 * persists AreaScoreSnapshot + AreaCategoryScore + an AreaHistory snapshot.
 * The engine itself never touches Prisma.
 */
@Injectable()
export class AreaScoringService {
  private readonly logger = new Logger(AreaScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Recompute and persist scores for one area. Returns the new snapshot. */
  async recomputeArea(areaId: string) {
    const area = await this.prisma.areaMaster.findUnique({
      where: { id: areaId },
    });
    if (!area) throw new NotFoundException('Area not found');

    const [
      { values: stats, newestAsOfDate },
      amenityCounts,
      sourceConfidences,
    ] = await Promise.all([
      this.latestStats(areaId),
      this.nearbyAmenityCounts(areaId),
      this.prisma.sourceConfidence.findMany({ where: { areaId } }),
    ]);

    const confidenceByCategory = new Map<AreaScoreCategory, number[]>();
    for (const sc of sourceConfidences) {
      const arr = confidenceByCategory.get(sc.category) ?? [];
      arr.push(sc.confidenceScore);
      confidenceByCategory.set(sc.category, arr);
    }

    const dataAgeHours = newestAsOfDate
      ? (Date.now() - newestAsOfDate.getTime()) / (1000 * 60 * 60)
      : null;

    const categoryInputs: CategoryScoreInput[] = [
      {
        category: 'SAFETY',
        categoryWeight: CATEGORY_WEIGHTS.SAFETY,
        inputs: computeSafetyInputs({
          crimeRatePer1000: stats.get('crime_rate_per_1000'),
          policeStationsWithin3Km: amenityCounts.POLICE,
          incidentReportsPerMonth: stats.get('incident_reports_per_month'),
        }),
        sourceConfidences: confidenceByCategory.get('SAFETY') ?? [],
        dataAgeHours,
      },
      {
        category: 'TRAFFIC',
        categoryWeight: CATEGORY_WEIGHTS.TRAFFIC,
        inputs: computeTrafficInputs({
          avgCommuteMinutes: stats.get('avg_commute_min'),
          congestionIndex: stats.get('congestion_index'),
        }),
        sourceConfidences: confidenceByCategory.get('TRAFFIC') ?? [],
        dataAgeHours,
      },
      {
        category: 'HEALTHCARE',
        categoryWeight: CATEGORY_WEIGHTS.HEALTHCARE,
        inputs: computeHealthcareInputs({
          hospitalsWithin5Km: amenityCounts.HOSPITAL,
          bedsPerThousand: stats.get('beds_per_thousand'),
        }),
        sourceConfidences: confidenceByCategory.get('HEALTHCARE') ?? [],
        dataAgeHours,
      },
      {
        category: 'SCHOOL',
        categoryWeight: CATEGORY_WEIGHTS.SCHOOL,
        inputs: computeSchoolInputs({
          schoolsWithin3Km: amenityCounts.SCHOOL,
          pupilTeacherRatio: stats.get('pupil_teacher_ratio'),
        }),
        sourceConfidences: confidenceByCategory.get('SCHOOL') ?? [],
        dataAgeHours,
      },
      {
        category: 'INTERNET',
        categoryWeight: CATEGORY_WEIGHTS.INTERNET,
        inputs: computeInternetInputs({
          avgDownloadMbps: stats.get('avg_download_mbps'),
          broadbandPenetrationPct: stats.get('broadband_penetration_pct'),
        }),
        sourceConfidences: confidenceByCategory.get('INTERNET') ?? [],
        dataAgeHours,
      },
      {
        category: 'UTILITIES',
        categoryWeight: CATEGORY_WEIGHTS.UTILITIES,
        inputs: computeUtilitiesInputs({
          waterSupplyHoursPerDay: stats.get('water_supply_hours_per_day'),
          powerOutagesPerMonth: stats.get('power_outages_per_month'),
        }),
        sourceConfidences: confidenceByCategory.get('UTILITIES') ?? [],
        dataAgeHours,
      },
    ];

    const result = AreaScoringEngine.computeOverallScore(categoryInputs);
    const computedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.areaScoreSnapshot.upsert({
        where: { areaId },
        create: {
          areaId,
          overallScore: result.overallScore,
          confidence: result.confidence,
          algoVersion: SCORING_ENGINE_VERSION,
          computedAt,
        },
        update: {
          overallScore: result.overallScore,
          confidence: result.confidence,
          algoVersion: SCORING_ENGINE_VERSION,
          computedAt,
        },
      }),
      ...result.categories.map((c) =>
        this.prisma.areaCategoryScore.upsert({
          where: { areaId_category: { areaId, category: c.category } },
          create: {
            areaId,
            category: c.category,
            score: c.score,
            confidence: c.confidence,
            weight: c.weightUsed,
            inputsUsed: c.inputsUsed,
            computedAt,
          },
          update: {
            score: c.score,
            confidence: c.confidence,
            weight: c.weightUsed,
            inputsUsed: c.inputsUsed,
            computedAt,
          },
        }),
      ),
      this.prisma.areaHistory.create({
        data: {
          areaId,
          snapshotAt: computedAt,
          overallScore: result.overallScore,
          categoryScores: Object.fromEntries(
            result.categories.map((c) => [c.category, c.score]),
          ),
          statsSnapshot: Object.fromEntries(stats.entries()),
        },
      }),
    ]);

    this.logger.log(
      `Recomputed scores for area ${areaId}: overall=${result.overallScore ?? 'null'} confidence=${result.confidence}`,
    );

    return result;
  }

  /** Latest value per statKey (highest asOfDate wins), plus the newest
   * asOfDate seen across all of them (used for the recency confidence factor). */
  private async latestStats(
    areaId: string,
  ): Promise<{ values: Map<string, number>; newestAsOfDate: Date | null }> {
    const rows = await this.prisma.areaStatistic.findMany({
      where: { areaId, statKey: { in: [...STAT_KEYS] } },
      orderBy: { asOfDate: 'desc' },
    });
    const values = new Map<string, number>();
    let newestAsOfDate: Date | null = null;
    for (const row of rows) {
      if (!newestAsOfDate || row.asOfDate > newestAsOfDate) {
        newestAsOfDate = row.asOfDate;
      }
      if (!values.has(row.statKey) && row.value !== null) {
        values.set(row.statKey, row.value);
      }
    }
    return { values, newestAsOfDate };
  }

  /** Count of nearby amenities per category, keyed by AmenityCategory. */
  private async nearbyAmenityCounts(
    areaId: string,
  ): Promise<Record<'POLICE' | 'HOSPITAL' | 'SCHOOL', number>> {
    const rows = await this.prisma.areaNearbyAmenity.findMany({
      where: { areaId },
      include: { amenity: { select: { category: true } } },
    });
    const counts = { POLICE: 0, HOSPITAL: 0, SCHOOL: 0 };
    for (const row of rows) {
      if (row.amenity.category === 'POLICE') counts.POLICE++;
      else if (row.amenity.category === 'HOSPITAL') counts.HOSPITAL++;
      else if (row.amenity.category === 'SCHOOL') counts.SCHOOL++;
    }
    return counts;
  }
}
