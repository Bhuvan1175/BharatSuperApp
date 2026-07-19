import { Injectable, NotFoundException } from '@nestjs/common';
import { AmenityCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../auth/strategies/jwt.strategy';
import { AreaMasterService } from './area-master/area-master.service';
import { PropertyStatisticsService } from './property-stats/property-statistics.service';
import { AreaCacheService } from './cache/area-cache.service';
import {
  ListAreasDto,
  SearchAreasDto,
  AreaHistoryQueryDto,
} from './dto/area-query.dto';
import { CompareAreasDto } from './dto/compare-areas.dto';

/**
 * Public Area Query API orchestration (`/areas/*`) — cache-first reads, DB
 * fallback on miss (docs §9). This is the one seam a future Postgres
 * read-replica connection would point at (docs §11).
 */
@Injectable()
export class AreaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly areaMaster: AreaMasterService,
    private readonly propertyStats: PropertyStatisticsService,
    private readonly cache: AreaCacheService,
  ) {}

  list(query: ListAreasDto) {
    return this.areaMaster.list(query);
  }

  async search(query: SearchAreasDto) {
    const cached = await this.cache.getSearch(query);
    if (cached) return cached;
    const result = await this.areaMaster.search(query);
    await this.cache.setSearch(query, result);
    return result;
  }

  async getDetail(areaId: string) {
    const cached = await this.cache.getDetail(areaId);
    if (cached) return cached;
    const area = await this.areaMaster.getById(areaId);
    await this.cache.setDetail(areaId, area);
    return area;
  }

  async getIntelligence(areaId: string) {
    const cached = await this.cache.getIntelligence(areaId);
    if (cached) return cached;

    const [snapshot, categories] = await Promise.all([
      this.prisma.areaScoreSnapshot.findUnique({ where: { areaId } }),
      this.prisma.areaCategoryScore.findMany({ where: { areaId } }),
    ]);
    if (!snapshot)
      throw new NotFoundException('No score computed for this area yet');

    const result = { ...snapshot, categories };
    await this.cache.setIntelligence(areaId, result);
    return result;
  }

  async getNearby(areaId: string, category?: AmenityCategory) {
    const cached = category ? null : await this.cache.getNearby(areaId);
    if (cached) return cached;

    const rows = await this.prisma.areaNearbyAmenity.findMany({
      where: { areaId, ...(category ? { amenity: { category } } : {}) },
      orderBy: { distanceMeters: 'asc' },
      include: { amenity: true },
    });
    if (!category) await this.cache.setNearby(areaId, rows);
    return rows;
  }

  async getPropertyStats(areaId: string) {
    const cached = await this.cache.getPropertyStats(areaId);
    if (cached) return cached;

    const [stats, priceHistory, builderRatings] = await Promise.all([
      this.propertyStats.getForArea(areaId),
      this.propertyStats.getPriceHistory(areaId),
      this.propertyStats.getBuilderRatings(areaId),
    ]);
    const result = { stats, priceHistory, builderRatings };
    await this.cache.setPropertyStats(areaId, result);
    return result;
  }

  getHistory(areaId: string, query: AreaHistoryQueryDto) {
    return this.prisma.areaHistory.findMany({
      where: {
        areaId,
        snapshotAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { snapshotAt: 'asc' },
    });
  }

  async getSummary(areaId: string) {
    const cached = await this.cache.getSummary(areaId);
    if (cached) return cached;

    const insight = await this.prisma.areaInsight.findFirst({
      where: { areaId, isCurrent: true },
      orderBy: { generatedAt: 'desc' },
    });
    if (!insight)
      throw new NotFoundException('No AI summary generated for this area yet');
    await this.cache.setSummary(areaId, insight);
    return insight;
  }

  async saveArea(user: AuthUser, areaId: string) {
    await this.areaMaster.getById(areaId); // 404s if the area doesn't exist
    return this.prisma.savedArea.upsert({
      where: { userId_areaId: { userId: user.userId, areaId } },
      create: { userId: user.userId, areaId },
      update: {},
    });
  }

  async unsaveArea(user: AuthUser, areaId: string) {
    await this.prisma.savedArea
      .delete({ where: { userId_areaId: { userId: user.userId, areaId } } })
      .catch(() => null); // idempotent — already-removed is not an error
    return { success: true, message: 'Area removed from saved list' };
  }

  mySavedAreas(user: AuthUser) {
    return this.prisma.savedArea.findMany({
      where: { userId: user.userId },
      include: {
        area: {
          include: {
            locality: { include: { city: true } },
            scoreSnapshot: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Stateless side-by-side comparison — computed on the fly, never persisted. */
  async compare(dto: CompareAreasDto) {
    const cached = await this.cache.getCompare(dto.areaIds);
    if (cached) return cached;

    const areas = await this.prisma.areaMaster.findMany({
      where: { id: { in: dto.areaIds } },
      include: {
        locality: { include: { city: true } },
        scoreSnapshot: true,
        categoryScores: true,
        statistics: { orderBy: { asOfDate: 'desc' } },
      },
    });
    if (areas.length !== dto.areaIds.length) {
      throw new NotFoundException('One or more areas were not found');
    }

    const result = areas.map((area) => ({
      id: area.id,
      name: area.locality.name,
      city: area.locality.city.name,
      overallScore: area.scoreSnapshot?.overallScore ?? null,
      confidence: area.scoreSnapshot?.confidence ?? null,
      categoryScores: Object.fromEntries(
        area.categoryScores.map((c) => [c.category, c.score]),
      ),
    }));

    await this.cache.setCompare(dto.areaIds, result);
    return result;
  }
}
