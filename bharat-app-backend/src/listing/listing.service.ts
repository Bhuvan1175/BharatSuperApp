import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  CreateListingDto,
  QueryListingsDto,
  UpdateListingDto,
} from './dto/listing.dto';

/** Common shape returned to clients (includes a light locality/city label). */
const listingInclude = {
  locality: { select: { id: true, name: true } },
  city: { select: { id: true, name: true } },
} satisfies Prisma.ListingInclude;

/**
 * Generic entries for every department module. ONE service serves all modules —
 * authorization is decided per-request from the entry's `moduleKey` against the
 * caller's permissions ("<moduleKey>:manage" or the "*" super-admin wildcard).
 */
@Injectable()
export class ListingService {
  constructor(private readonly prisma: PrismaService) {}

  private canManage(user: AuthUser, moduleKey: string): boolean {
    const perms = user?.permissions ?? [];
    return perms.includes('*') || perms.includes(`${moduleKey}:manage`);
  }

  private assertCanManage(user: AuthUser, moduleKey: string) {
    if (!this.canManage(user, moduleKey)) {
      throw new ForbiddenException(
        `You do not have manage access to the "${moduleKey}" module`,
      );
    }
  }

  /**
   * List entries. Managers of the module (and super admin) see everything;
   * everyone else sees only "active" entries — so this endpoint safely serves
   * both the manager dashboard and the citizen-facing feed.
   */
  list(user: AuthUser, query: QueryListingsDto) {
    const where: Prisma.ListingWhereInput = {};
    if (query.moduleKey) where.moduleKey = query.moduleKey;
    if (query.localityId) where.localityId = query.localityId;
    if (query.cityId) where.cityId = query.cityId;
    if (query.type) where.type = query.type;

    const isManager = query.moduleKey
      ? this.canManage(user, query.moduleKey)
      : false;

    if (query.status) {
      where.status = query.status;
    } else if (!isManager) {
      where.status = 'active';
    }

    return this.prisma.listing.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: listingInclude,
    });
  }

  /** Dashboard counts for a module. Manager-only. */
  async stats(user: AuthUser, moduleKey: string) {
    this.assertCanManage(user, moduleKey);
    const [total, active, scheduled, archived] = await Promise.all([
      this.prisma.listing.count({ where: { moduleKey } }),
      this.prisma.listing.count({ where: { moduleKey, status: 'active' } }),
      this.prisma.listing.count({ where: { moduleKey, status: 'scheduled' } }),
      this.prisma.listing.count({ where: { moduleKey, status: 'archived' } }),
    ]);
    return { total, active, scheduled, archived };
  }

  async getOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: listingInclude,
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async create(user: AuthUser, dto: CreateListingDto) {
    this.assertCanManage(user, dto.moduleKey);

    // If only a locality is given, derive its city for consistent filtering.
    let cityId = dto.cityId ?? null;
    if (dto.localityId) {
      const loc = await this.prisma.locality.findUnique({
        where: { id: dto.localityId },
      });
      if (!loc) throw new NotFoundException('Locality not found');
      cityId = cityId ?? loc.cityId;
    }

    return this.prisma.listing.create({
      data: {
        moduleKey: dto.moduleKey,
        type: dto.type ?? 'update',
        title: dto.title,
        body: dto.body ?? null,
        status: dto.status ?? 'active',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        data: (dto.data as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        cityId,
        localityId: dto.localityId ?? null,
        createdById: user.userId,
      },
      include: listingInclude,
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateListingDto) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Listing not found');
    this.assertCanManage(user, existing.moduleKey);

    const data: Prisma.ListingUncheckedUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.scheduledAt !== undefined)
      data.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (dto.expiresAt !== undefined)
      data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.data !== undefined)
      data.data = (dto.data as Prisma.InputJsonValue) ?? Prisma.JsonNull;

    // Location change: keep city consistent with locality when locality changes.
    if (dto.localityId !== undefined) {
      data.localityId = dto.localityId || null;
      if (dto.localityId) {
        const loc = await this.prisma.locality.findUnique({
          where: { id: dto.localityId },
        });
        if (!loc) throw new NotFoundException('Locality not found');
        if (dto.cityId === undefined) data.cityId = loc.cityId;
      }
    }
    if (dto.cityId !== undefined) data.cityId = dto.cityId || null;

    return this.prisma.listing.update({
      where: { id },
      data,
      include: listingInclude,
    });
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Listing not found');
    this.assertCanManage(user, existing.moduleKey);
    await this.prisma.listing.delete({ where: { id } });
    return { success: true, message: 'Listing deleted' };
  }
}
