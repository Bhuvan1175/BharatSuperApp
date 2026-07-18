import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Medicine, Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../auth/strategies/jwt.strategy';
import {
  CreateMedicineDto,
  CreateMedicineRequestDto,
  QueryMedicineRequestsDto,
  QueryMedicinesDto,
  StockStatus,
  UpdateMedicineDto,
  UpdateRequestStatusDto,
  UpdateStockDto,
  UpdateStoreDto,
} from './dto/medicine.dto';

/** The Medicine department is special-cased throughout (see RoleRouter on the
 * frontend); its `moduleKey` is the stable handle used to find its Department
 * row without needing a departmentId on the JWT/AuthUser context. */
const MEDICINE_MODULE_KEY = 'medicine';

/**
 * "All India Pincode Directory till last month" on data.gov.in — the same
 * live resource GovtLocationProvider (src/location) uses to auto-fill the
 * location hierarchy. Unlike the older, retired 04cbe4b1… copy, this one's
 * latitude/longitude columns are actually populated for most offices, so a
 * pincode lookup here doubles as a geocoder for the store's pickup address.
 */
const PINCODE_RESOURCE_ID =
  process.env.DATA_GOV_IN_PINCODE_RESOURCE_ID ||
  '5c2f62fe-5afa-4119-a499-fec9d604d5bd';

export interface PincodeSuggestion {
  officeName: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

/** Valid forward moves in the request lifecycle. Anything else is rejected. */
const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['READY_FOR_PICKUP', 'REJECTED'],
  READY_FOR_PICKUP: ['COMPLETED', 'REJECTED'],
  REJECTED: [],
  COMPLETED: [],
};

const medicineRequestInclude = {
  medicine: { select: { id: true, name: true, unit: true } },
  citizen: { select: { id: true, name: true, phoneNumber: true } },
} satisfies Prisma.MedicineRequestInclude;

/**
 * Real Medicine Store domain: inventory + citizen request workflow. The store
 * dashboard (MEDICINE_MANAGER) is the source of truth — citizens only ever see
 * medicines that are active AND in stock, and only a manager decision here
 * moves a request forward or changes stock.
 */
@Injectable()
export class MedicineService {
  private readonly logger = new Logger(MedicineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Derived stock status — never stored, so it can't go stale. */
  stockStatusOf(m: Pick<Medicine, 'stockQty' | 'lowStockThreshold'>): StockStatus {
    if (m.stockQty <= 0) return 'OUT_OF_STOCK';
    if (m.stockQty <= m.lowStockThreshold) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  private withStockStatus<T extends Pick<Medicine, 'stockQty' | 'lowStockThreshold'>>(
    m: T,
  ) {
    return { ...m, stockStatus: this.stockStatusOf(m) };
  }

  /**
   * List medicines. Managers (and super admin) see the full catalogue,
   * including out-of-stock and inactive items, so they can restock/manage.
   * Everyone else (citizens) sees only active, in-stock medicines — the store
   * dashboard is the source of truth for what's requestable.
   */
  async list(user: AuthUser, query: QueryMedicinesDto) {
    const isManager = user.role === 'MEDICINE_MANAGER' || user.role === 'SUPER_ADMIN';

    const where: Prisma.MedicineWhereInput = {};
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (isManager) {
      if (!query.includeInactive) where.isActive = true;
    } else {
      where.isActive = true;
      where.stockQty = { gt: 0 };
    }

    const medicines = await this.prisma.medicine.findMany({
      where,
      orderBy: [{ name: 'asc' }],
    });

    return medicines.map(m => this.withStockStatus(m));
  }

  async getOne(id: string) {
    const medicine = await this.prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundException('Medicine not found');
    return this.withStockStatus(medicine);
  }

  async create(user: AuthUser, dto: CreateMedicineDto) {
    const medicine = await this.prisma.medicine.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        strength: dto.strength ?? null,
        manufacturer: dto.manufacturer ?? null,
        batchNumber: dto.batchNumber ?? null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        unit: dto.unit ?? 'unit',
        price: dto.price ?? 0,
        stockQty: dto.stockQty ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 10,
        genericName: dto.genericName ?? null,
        genericPrice: dto.genericPrice ?? null,
        dosageNote: dto.dosageNote ?? null,
        createdById: user.userId,
      },
    });
    return this.withStockStatus(medicine);
  }

  async update(id: string, dto: UpdateMedicineDto) {
    await this.getOne(id);
    const medicine = await this.prisma.medicine.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        strength: dto.strength,
        manufacturer: dto.manufacturer,
        batchNumber: dto.batchNumber,
        expiryDate: dto.expiryDate !== undefined ? new Date(dto.expiryDate) : undefined,
        unit: dto.unit,
        price: dto.price,
        lowStockThreshold: dto.lowStockThreshold,
        isActive: dto.isActive,
        genericName: dto.genericName,
        genericPrice: dto.genericPrice,
        dosageNote: dto.dosageNote,
      },
    });
    return this.withStockStatus(medicine);
  }

  /** Sets the absolute stock quantity (e.g. after a restock count). */
  async updateStock(id: string, dto: UpdateStockDto) {
    await this.getOne(id);
    const medicine = await this.prisma.medicine.update({
      where: { id },
      data: { stockQty: dto.stockQty },
    });
    return this.withStockStatus(medicine);
  }

  /**
   * Soft-remove: hides the medicine from every list (citizen + default manager
   * view) without deleting it, so past requests referencing it stay intact.
   */
  async remove(id: string) {
    await this.getOne(id);
    await this.prisma.medicine.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, message: 'Medicine removed' };
  }

  /** Dashboard overview counts for the store manager. */
  async stats() {
    const [totalMedicines, totalRequests, pendingRequests, activeMedicines] =
      await Promise.all([
        this.prisma.medicine.count({ where: { isActive: true } }),
        this.prisma.medicineRequest.count(),
        this.prisma.medicineRequest.count({ where: { status: 'PENDING' } }),
        this.prisma.medicine.findMany({
          where: { isActive: true },
          select: { stockQty: true, lowStockThreshold: true },
        }),
      ]);

    const lowStockMedicines = activeMedicines.filter(
      m => m.stockQty > 0 && m.stockQty <= m.lowStockThreshold,
    ).length;
    const outOfStockMedicines = activeMedicines.filter(
      m => m.stockQty <= 0,
    ).length;

    return {
      totalMedicines,
      totalRequests,
      pendingRequests,
      lowStockMedicines,
      outOfStockMedicines,
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Store profile (pickup location / contact)                               */
  /* ---------------------------------------------------------------------- */

  /**
   * The store's pickup location/contact details. Visible to anyone
   * authenticated (citizens need this to know where to collect a medicine),
   * editable only by MEDICINE_MANAGER via {@link updateStore}.
   */
  async getStore() {
    const dept = await this.prisma.department.findUnique({
      where: { moduleKey: MEDICINE_MODULE_KEY },
      select: {
        id: true,
        name: true,
        label: true,
        address: true,
        latitude: true,
        longitude: true,
        phone: true,
        openingHours: true,
      },
    });
    if (!dept) throw new NotFoundException('Medicine store is not set up yet');
    return dept;
  }

  async updateStore(dto: UpdateStoreDto) {
    const dept = await this.prisma.department.findUnique({
      where: { moduleKey: MEDICINE_MODULE_KEY },
    });
    if (!dept) throw new NotFoundException('Medicine store is not set up yet');

    const updated = await this.prisma.department.update({
      where: { id: dept.id },
      data: {
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        openingHours: dto.openingHours,
      },
      select: {
        id: true,
        name: true,
        label: true,
        address: true,
        latitude: true,
        longitude: true,
        phone: true,
        openingHours: true,
      },
    });
    return updated;
  }

  /* ---------------------------------------------------------------------- */
  /* Address autocomplete + geocoding (pickup location)                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Address "autocomplete" for the pickup location. data.gov.in's pincode
   * directory isn't a free-text address search — it's an exact/filtered
   * lookup — so the UX is: the manager types a 6-digit PIN, and this returns
   * every post office under it (locality + district + state), each already
   * carrying real coordinates from data.gov.in where available.
   */
  async pincodeLookup(pincode: string): Promise<PincodeSuggestion[]> {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (!apiKey) {
      this.logger.warn('DATA_GOV_IN_API_KEY is not set — pincode lookup disabled');
      return [];
    }

    const url =
      `https://api.data.gov.in/resource/${PINCODE_RESOURCE_ID}` +
      `?api-key=${encodeURIComponent(apiKey)}&format=json&limit=20` +
      `&filters[pincode]=${encodeURIComponent(pincode)}`;

    const records = await this.fetchJsonRecords(url);
    const seen = new Set<string>();
    const suggestions: PincodeSuggestion[] = [];

    for (const r of records) {
      const officeName = this.cleanOfficeName(String(r.officename ?? ''));
      const district = String(r.district ?? r.districtname ?? '');
      const state = String(r.statename ?? '');
      if (!officeName) continue;
      const key = `${officeName}|${district}|${state}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      suggestions.push({
        officeName,
        district,
        state,
        pincode,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
      });
    }

    return suggestions.slice(0, 10);
  }

  /**
   * Fallback geocoder for when a picked office has no coordinates in
   * data.gov.in, or the manager typed a full address by hand. Uses
   * OpenStreetMap Nominatim (free, no key) — data.gov.in has no general
   * address-geocoding API.
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    const url =
      'https://nominatim.openstreetmap.org/search' +
      `?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(address)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BharatSuperApp/1.0 (medicine store locator)' },
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim returned ${res.status}`);
        return null;
      }
      const hits = (await res.json()) as Array<{ lat: string; lon: string }>;
      const hit = hits?.[0];
      if (!hit) return null;
      const latitude = Number(hit.lat);
      const longitude = Number(hit.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { latitude, longitude };
    } catch (e) {
      this.logger.warn(`Nominatim request failed: ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** GET a data.gov.in resource URL; returns its `records` array ([] on failure). */
  private async fetchJsonRecords(url: string): Promise<Record<string, unknown>[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        this.logger.warn(`data.gov.in returned ${res.status}`);
        return [];
      }
      const json = (await res.json()) as { records?: unknown };
      return Array.isArray(json.records)
        ? (json.records as Record<string, unknown>[])
        : [];
    } catch (e) {
      this.logger.warn(`data.gov.in request failed: ${(e as Error).message}`);
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  /** Strip post-office suffixes (B.O / S.O / H.O / G.P.O) to get a clean place name. */
  private cleanOfficeName(office: string): string {
    return office
      .replace(/\s*\(.*?\)\s*$/, '')
      .replace(/\s+(B\.?O|S\.?O|H\.?O|G\.?P\.?O|P\.?O)\.?$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------------------------------------------------------------------- */
  /* Requests                                                                */
  /* ---------------------------------------------------------------------- */

  /** Citizen creates a request. Blocked if the medicine can't cover it. */
  async createRequest(user: AuthUser, dto: CreateMedicineRequestDto) {
    const medicine = await this.prisma.medicine.findUnique({
      where: { id: dto.medicineId },
    });
    if (!medicine || !medicine.isActive) {
      throw new NotFoundException('Medicine not found');
    }
    if (medicine.stockQty < dto.quantity) {
      throw new BadRequestException(
        medicine.stockQty === 0
          ? 'This medicine is currently out of stock'
          : `Only ${medicine.stockQty} ${medicine.unit}(s) available`,
      );
    }

    const citizen = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true, phoneNumber: true },
    });

    return this.prisma.medicineRequest.create({
      data: {
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: dto.quantity,
        notes: dto.notes ?? null,
        citizenId: user.userId,
        citizenName: citizen?.name ?? citizen?.phoneNumber ?? null,
        status: 'PENDING',
      },
      include: medicineRequestInclude,
    });
  }

  /** Manager view: every request, newest first, optionally filtered. */
  listRequests(query: QueryMedicineRequestsDto) {
    const where: Prisma.MedicineRequestWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.medicineId) where.medicineId = query.medicineId;

    return this.prisma.medicineRequest.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: medicineRequestInclude,
    });
  }

  /** Citizen's own request history. */
  myRequests(user: AuthUser) {
    return this.prisma.medicineRequest.findMany({
      where: { citizenId: user.userId },
      orderBy: [{ createdAt: 'desc' }],
      include: medicineRequestInclude,
    });
  }

  /**
   * Manager decision. Validates the lifecycle transition and, only on
   * COMPLETED, atomically decrements stock — so stock only ever moves once,
   * exactly when the medicine actually leaves the store.
   */
  async updateRequestStatus(
    user: AuthUser,
    id: string,
    dto: UpdateRequestStatusDto,
  ) {
    const existing = await this.prisma.medicineRequest.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Request not found');

    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status as RequestStatus)) {
      throw new BadRequestException(
        `Cannot move a "${existing.status}" request to "${dto.status}"`,
      );
    }

    if (dto.status === 'COMPLETED') {
      return this.prisma.$transaction(async tx => {
        const medicine = await tx.medicine.findUnique({
          where: { id: existing.medicineId },
        });
        if (medicine) {
          await tx.medicine.update({
            where: { id: medicine.id },
            data: { stockQty: Math.max(0, medicine.stockQty - existing.quantity) },
          });
        }
        return tx.medicineRequest.update({
          where: { id },
          data: {
            status: dto.status as RequestStatus,
            notes: dto.notes ?? existing.notes,
            decidedById: user.userId,
            decidedAt: new Date(),
          },
          include: medicineRequestInclude,
        });
      });
    }

    return this.prisma.medicineRequest.update({
      where: { id },
      data: {
        status: dto.status as RequestStatus,
        notes: dto.notes ?? existing.notes,
        decidedById: user.userId,
        decidedAt: new Date(),
      },
      include: medicineRequestInclude,
    });
  }
}
