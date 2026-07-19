import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAreaMasterDto } from './dto/create-area-master.dto';
import { ListAreasDto, SearchAreasDto } from '../dto/area-query.dto';
import { haversineDistanceMeters } from '../collector/normalization/geo-normalizer';

const areaListInclude = {
  locality: { include: { city: { select: { id: true, name: true } } } },
  scoreSnapshot: {
    select: { overallScore: true, confidence: true, computedAt: true },
  },
} satisfies Prisma.AreaMasterInclude;

/**
 * Area Master — canonical area registry, a 1:1 extension of Locality (never a
 * parallel geo hierarchy). Read methods back the public Area Query API;
 * write methods (create/sync) are admin/job-only.
 */
@Injectable()
export class AreaMasterService {
  private readonly logger = new Logger(AreaMasterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Cursor-paginated list, optionally filtered by city. */
  async list(query: ListAreasDto) {
    const limit = query.limit ?? 20;
    const areas = await this.prisma.areaMaster.findMany({
      where: query.cityId ? { locality: { cityId: query.cityId } } : undefined,
      include: areaListInclude,
      orderBy: { id: 'asc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = areas.length > limit;
    const page = hasMore ? areas.slice(0, limit) : areas;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  /** Text (name/pincode) or geo (lat/long + radius) search. */
  async search(query: SearchAreasDto) {
    const limit = query.limit ?? 20;

    if (query.latitude !== undefined && query.longitude !== undefined) {
      return this.searchByGeo(
        query.latitude,
        query.longitude,
        query.radiusMeters ?? 5000,
        limit,
      );
    }

    const localityWhere: Prisma.LocalityWhereInput = {};
    if (query.q) {
      localityWhere.name = { contains: query.q, mode: 'insensitive' };
    }
    if (query.pincode) {
      localityWhere.pincode = query.pincode;
    }

    return this.prisma.areaMaster.findMany({
      where: { locality: localityWhere },
      include: areaListInclude,
      take: limit,
      orderBy: { locality: { name: 'asc' } },
    });
  }

  /**
   * Geo search: bounded by a lat/long box first (index-friendly on Locality),
   * then filtered/sorted by true haversine distance in application code.
   * Deferred: PostGIS (docs §11 originally called for it) — a GiST-indexed
   * nearest-neighbor query is the right answer once area volume justifies the
   * extra infra; a bounding box + in-memory sort is sufficient well past
   * launch scale and needs no new infrastructure.
   */
  private async searchByGeo(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    limit: number,
  ) {
    const degreeDelta = radiusMeters / 111_000; // ~111km per degree latitude
    const candidates = await this.prisma.areaMaster.findMany({
      where: {
        locality: {
          latitude: {
            gte: latitude - degreeDelta,
            lte: latitude + degreeDelta,
          },
          longitude: {
            gte: longitude - degreeDelta,
            lte: longitude + degreeDelta,
          },
        },
      },
      include: areaListInclude,
      take: 500, // bounding-box candidate cap before precise distance filtering
    });

    return candidates
      .map((area) => ({
        ...area,
        distanceMeters: Math.round(
          haversineDistanceMeters(
            latitude,
            longitude,
            area.locality.latitude!,
            area.locality.longitude!,
          ),
        ),
      }))
      .filter((area) => area.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);
  }

  async getById(id: string) {
    const area = await this.prisma.areaMaster.findUnique({
      where: { id },
      include: {
        locality: {
          include: {
            city: { include: { district: { include: { state: true } } } },
          },
        },
        scoreSnapshot: true,
      },
    });
    if (!area) throw new NotFoundException('Area not found');
    return area;
  }

  /** Admin: register an AreaMaster row for a Locality that doesn't have one. */
  async create(dto: CreateAreaMasterDto) {
    const locality = await this.prisma.locality.findUnique({
      where: { id: dto.localityId },
    });
    if (!locality) throw new NotFoundException('Locality not found');

    try {
      return await this.prisma.areaMaster.create({
        data: {
          localityId: dto.localityId,
          administrativeCode: dto.administrativeCode,
          population: dto.population,
          populationYear: dto.populationYear,
          source: 'MANUAL',
          syncStatus: 'PENDING',
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'This locality already has an Area Master row',
        );
      }
      throw e as Error;
    }
  }

  /**
   * Area Master Sync job body: reconciles new Locality rows into AreaMaster
   * (docs §7, weekly). Idempotent — only creates rows for localities that
   * don't have one yet. Returns how many were added.
   */
  async syncFromLocalities(): Promise<number> {
    const localities = await this.prisma.locality.findMany({
      where: { areaMaster: null },
      select: { id: true },
    });
    if (!localities.length) return 0;

    const result = await this.prisma.areaMaster.createMany({
      data: localities.map((l) => ({
        localityId: l.id,
        source: 'GOVT' as const,
        syncStatus: 'SYNCED' as const,
        lastSyncedAt: new Date(),
      })),
      skipDuplicates: true,
    });
    this.logger.log(`Area Master sync: added ${result.count} new area(s)`);
    return result.count;
  }

  async markSyncStatus(areaId: string, status: 'SYNCED' | 'FAILED' | 'STALE') {
    await this.prisma.areaMaster.update({
      where: { id: areaId },
      data: {
        syncStatus: status,
        lastSyncedAt: status === 'SYNCED' ? new Date() : undefined,
      },
    });
  }

  /** All area ids — used by bulk background jobs (refresh/recalculate all). */
  async allAreaIds(): Promise<string[]> {
    const rows = await this.prisma.areaMaster.findMany({
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
