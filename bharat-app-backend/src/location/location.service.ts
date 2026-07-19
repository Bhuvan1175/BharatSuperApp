import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  CreateCityDto,
  CreateDistrictDto,
  CreateStateDto,
} from './dto/city.dto';
import { BulkNamesDto, CreateLocalityDto } from './dto/locality.dto';
import { CreateWardDto } from './dto/ward.dto';
import { LocationDataService } from './providers/location-data.service';

type Suggestion = {
  source: 'openai' | 'none';
  suggestions: string[];
  message: string;
};

/** A city joined with its district + state names, for provider context. */
type CityWithParents = Prisma.CityGetPayload<{
  include: { district: { include: { state: true } } };
}>;

/**
 * Location hierarchy: State → District → City → (Locality | Ward). Shared
 * reference data for every module. Reads are open to any authenticated user;
 * writes are manager-only (any user holding a "<module>:manage" permission,
 * or "*").
 *
 * Auto-fill: when a district is created, its villages/cities are fetched and
 * saved automatically (best-effort, via LocationDataService). Wards are fetched
 * lazily the first time a city's ward list is requested — so we never fire
 * hundreds of provider calls up front, yet the ward dropdown still populates on
 * its own the moment a manager opens a village.
 */
@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationData: LocationDataService,
  ) {}

  private assertManager(user: AuthUser) {
    const perms = user?.permissions ?? [];
    const isManager =
      perms.includes('*') || perms.some((p) => p.endsWith(':manage'));
    if (!isManager) {
      throw new ForbiddenException(
        'Only department managers can manage locations',
      );
    }
  }

  private conflict(error: unknown, label: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(`This ${label} already exists`);
    }
    throw error as Error;
  }

  /* ------------------------------ States ------------------------------- */

  listStates() {
    return this.prisma.state.findMany({
      orderBy: [{ name: 'asc' }],
      include: { _count: { select: { districts: true } } },
    });
  }

  async createState(user: AuthUser, dto: CreateStateDto) {
    this.assertManager(user);
    try {
      return await this.prisma.state.create({ data: { name: dto.name.trim() } });
    } catch (e) {
      this.conflict(e, 'state');
    }
  }

  async deleteState(user: AuthUser, id: string) {
    this.assertManager(user);
    const state = await this.prisma.state.findUnique({ where: { id } });
    if (!state) throw new NotFoundException('State not found');
    await this.prisma.state.delete({ where: { id } });
    return { success: true, message: `State "${state.name}" deleted` };
  }

  /* ----------------------------- Districts ----------------------------- */

  async listDistricts(stateId: string) {
    const state = await this.prisma.state.findUnique({ where: { id: stateId } });
    if (!state) throw new NotFoundException('State not found');
    return this.prisma.district.findMany({
      where: { stateId },
      orderBy: [{ name: 'asc' }],
      include: { _count: { select: { cities: true } } },
    });
  }

  async createDistrict(user: AuthUser, stateId: string, dto: CreateDistrictDto) {
    this.assertManager(user);
    const state = await this.prisma.state.findUnique({ where: { id: stateId } });
    if (!state) throw new NotFoundException('State not found');
    const district = await this.prisma.district
      .create({ data: { stateId, name: dto.name.trim() } })
      .catch((e) => this.conflict(e, 'district'));
    // Fully automatic, but fire-and-forget: villages fetch & save in the
    // background so the request returns immediately (an AI call can take several
    // seconds — longer than the mobile client's 15s timeout for a big district).
    // The app refreshes the village list shortly after. Best-effort; never
    // blocks or fails district creation.
    void this.autoFetchCities(district.id, district.name, state.name);
    return district;
  }

  async bulkDistricts(user: AuthUser, stateId: string, dto: BulkNamesDto) {
    this.assertManager(user);
    const state = await this.prisma.state.findUnique({ where: { id: stateId } });
    if (!state) throw new NotFoundException('State not found');
    const names = this.cleanNames(dto.names);
    const res = await this.prisma.district.createMany({
      data: names.map((name) => ({ stateId, name })),
      skipDuplicates: true,
    });
    return { added: res.count };
  }

  async deleteDistrict(user: AuthUser, id: string) {
    this.assertManager(user);
    const district = await this.prisma.district.findUnique({ where: { id } });
    if (!district) throw new NotFoundException('District not found');
    await this.prisma.district.delete({ where: { id } });
    return { success: true, message: `District "${district.name}" deleted` };
  }

  /**
   * Re-run village auto-fetch for an existing district (e.g. one created before
   * auto-fill existed, or to pick up more). Returns how many NEW villages were
   * added.
   */
  async refetchCities(user: AuthUser, districtId: string) {
    this.assertManager(user);
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      include: { state: true },
    });
    if (!district) throw new NotFoundException('District not found');
    if (!this.locationData.isConfigured()) {
      return {
        added: 0,
        message:
          'Auto-fetch is off. Set OPENAI_API_KEY (or a data provider) on the backend.',
      };
    }
    const before = await this.prisma.city.count({ where: { districtId } });
    await this.autoFetchCities(district.id, district.name, district.state.name);
    const after = await this.prisma.city.count({ where: { districtId } });
    const added = after - before;
    return { added, message: `Added ${added} new village(s).` };
  }

  async suggestDistricts(user: AuthUser, stateId: string): Promise<Suggestion> {
    this.assertManager(user);
    const state = await this.prisma.state.findUnique({ where: { id: stateId } });
    if (!state) throw new NotFoundException('State not found');
    return this.suggestNames(
      `List up to 40 districts in the state of ${state.name}, India.`,
    );
  }

  /* ------------------------------ Cities ------------------------------- */

  async listCities(districtId: string) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
    });
    if (!district) throw new NotFoundException('District not found');
    return this.prisma.city.findMany({
      where: { districtId },
      orderBy: [{ name: 'asc' }],
      include: { _count: { select: { localities: true, wards: true } } },
    });
  }

  async createCity(user: AuthUser, districtId: string, dto: CreateCityDto) {
    this.assertManager(user);
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
    });
    if (!district) throw new NotFoundException('District not found');
    try {
      return await this.prisma.city.create({
        data: { districtId, name: dto.name.trim(), source: 'manual' },
      });
    } catch (e) {
      this.conflict(e, 'city');
    }
  }

  async bulkCities(user: AuthUser, districtId: string, dto: BulkNamesDto) {
    this.assertManager(user);
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
    });
    if (!district) throw new NotFoundException('District not found');
    const names = this.cleanNames(dto.names);
    const res = await this.prisma.city.createMany({
      data: names.map((name) => ({ districtId, name, source: 'manual' })),
      skipDuplicates: true,
    });
    return { added: res.count };
  }

  async deleteCity(user: AuthUser, id: string) {
    this.assertManager(user);
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) throw new NotFoundException('City not found');
    await this.prisma.city.delete({ where: { id } });
    return { success: true, message: `City "${city.name}" deleted` };
  }

  async suggestCities(user: AuthUser, districtId: string): Promise<Suggestion> {
    this.assertManager(user);
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      include: { state: true },
    });
    if (!district) throw new NotFoundException('District not found');
    return this.suggestNames(
      `List up to 40 cities and towns in ${district.name} district, ${district.state.name}, India.`,
    );
  }

  /* ------------------------------- Wards ------------------------------- */

  /**
   * List a city's wards. On first access (wardsFetched === false) this fetches
   * and saves them automatically from the active provider, so the ward dropdown
   * populates on its own. Ordered numerically by ward number.
   */
  async listWards(cityId: string) {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      include: { district: { include: { state: true } } },
    });
    if (!city) throw new NotFoundException('City not found');

    if (!city.wardsFetched && this.locationData.isConfigured()) {
      await this.autoFetchWards(city);
    }

    const wards = await this.prisma.ward.findMany({ where: { cityId } });
    return wards.sort((a, b) => {
      const na = parseInt(a.number, 10);
      const nb = parseInt(b.number, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return a.number.localeCompare(b.number);
    });
  }

  async createWard(user: AuthUser, cityId: string, dto: CreateWardDto) {
    this.assertManager(user);
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new NotFoundException('City not found');
    try {
      return await this.prisma.ward.create({
        data: {
          cityId,
          number: dto.number.trim(),
          name: dto.name.trim(),
          source: 'manual',
        },
      });
    } catch (e) {
      this.conflict(e, 'ward');
    }
  }

  async deleteWard(user: AuthUser, id: string) {
    this.assertManager(user);
    const ward = await this.prisma.ward.findUnique({ where: { id } });
    if (!ward) throw new NotFoundException('Ward not found');
    await this.prisma.ward.delete({ where: { id } });
    return {
      success: true,
      message: `Ward "${ward.number} — ${ward.name}" deleted`,
    };
  }

  /** Force a fresh ward auto-fetch for a city. Returns how many NEW were added. */
  async refetchWards(user: AuthUser, cityId: string) {
    this.assertManager(user);
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      include: { district: { include: { state: true } } },
    });
    if (!city) throw new NotFoundException('City not found');
    if (!this.locationData.isConfigured()) {
      return {
        added: 0,
        message:
          'Auto-fetch is off. Set OPENAI_API_KEY (or a data provider) on the backend.',
      };
    }
    const before = await this.prisma.ward.count({ where: { cityId } });
    await this.autoFetchWards(city);
    const after = await this.prisma.ward.count({ where: { cityId } });
    const added = after - before;
    return { added, message: `Added ${added} new ward(s).` };
  }

  /* ---------------------------- Localities ----------------------------- */

  async listLocalities(cityId: string) {
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new NotFoundException('City not found');
    return this.prisma.locality.findMany({
      where: { cityId },
      orderBy: [{ name: 'asc' }],
    });
  }

  async createLocality(user: AuthUser, cityId: string, dto: CreateLocalityDto) {
    this.assertManager(user);
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new NotFoundException('City not found');
    const pincode = dto.pincode?.trim() || null;
    const locality = await this.prisma.locality
      .create({ data: { cityId, name: dto.name.trim(), pincode } })
      .catch((e) => this.conflict(e, 'locality'));
    // Fire-and-forget, same pattern as autoFetchCities: a PIN code lets us
    // resolve real coordinates (data.gov.in's pincode directory carries
    // lat/long), which is what unlocks nearby-amenity collection for this
    // area later — but it shouldn't block the create response. The name is
    // passed along too since one PIN code can cover several post offices.
    if (pincode) {
      void this.autoGeocodeLocality(
        locality.id,
        pincode,
        dto.name.trim(),
        city.name,
      );
    }
    return locality;
  }

  async bulkLocalities(user: AuthUser, cityId: string, dto: BulkNamesDto) {
    this.assertManager(user);
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new NotFoundException('City not found');
    const names = this.cleanNames(dto.names);
    const res = await this.prisma.locality.createMany({
      data: names.map((name) => ({ cityId, name })),
      skipDuplicates: true,
    });
    return { added: res.count };
  }

  async deleteLocality(user: AuthUser, id: string) {
    this.assertManager(user);
    const loc = await this.prisma.locality.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException('Locality not found');
    await this.prisma.locality.delete({ where: { id } });
    return { success: true, message: `Locality "${loc.name}" deleted` };
  }

  async suggestLocalities(user: AuthUser, cityId: string): Promise<Suggestion> {
    this.assertManager(user);
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      include: { district: { include: { state: true } } },
    });
    if (!city) throw new NotFoundException('City not found');
    const where = `${city.name}, ${city.district.name} district, ${city.district.state.name}, India`;
    return this.suggestNames(
      `List up to 30 localities, areas, and wards in ${where}.`,
    );
  }

  /* --------------------------- Auto-fetch ------------------------------ */

  /** Whether auto-fill is available, and which provider is active. */
  aiStatus() {
    return {
      enabled: this.locationData.isConfigured(),
      provider: this.locationData.activeProviderName(),
      wardsAuto: this.locationData.wardsAutoAvailable(),
    };
  }

  /** Fetch & save a district's villages. Best-effort — never throws. */
  private async autoFetchCities(
    districtId: string,
    districtName: string,
    stateName: string,
  ): Promise<void> {
    if (!this.locationData.isConfigured()) return;
    try {
      const villages = await this.locationData.fetchVillages({
        state: stateName,
        district: districtName,
      });
      const names = this.cleanNames(villages.map((v) => v.name));
      if (names.length) {
        await this.prisma.city.createMany({
          data: names.map((name) => ({
            districtId,
            name,
            source: this.locationData.activeProviderName(),
          })),
          skipDuplicates: true,
        });
      }
      await this.prisma.district.update({
        where: { id: districtId },
        data: { citiesFetched: true },
      });
    } catch {
      // Best-effort: manual entry still works even if the provider fails.
    }
  }

  /** Fetch & save a city's wards. Best-effort — never throws. */
  private async autoFetchWards(city: CityWithParents): Promise<void> {
    try {
      const wards = await this.locationData.fetchWards({
        state: city.district.state.name,
        district: city.district.name,
        city: city.name,
      });
      if (wards.length) {
        await this.prisma.ward.createMany({
          data: wards.map((w) => ({
            cityId: city.id,
            number: w.number,
            name: w.name,
            source: this.locationData.activeProviderName(),
          })),
          skipDuplicates: true,
        });
      }
      await this.prisma.city.update({
        where: { id: city.id },
        data: { wardsFetched: true },
      });
    } catch {
      // Best-effort.
    }
  }

  /** Resolve + save a locality's lat/long from its PIN code (+ name, to
   * disambiguate a PIN code covering several post offices). Best-effort —
   * never throws; the locality is already created and usable either way. */
  private async autoGeocodeLocality(
    localityId: string,
    pincode: string,
    localityName: string,
    cityName: string,
  ): Promise<void> {
    try {
      const coords = await this.locationData.geocodePincode(pincode, {
        localityName,
        cityName,
      });
      if (coords) {
        await this.prisma.locality.update({
          where: { id: localityId },
          data: { latitude: coords.latitude, longitude: coords.longitude },
        });
      }
    } catch {
      // Best-effort.
    }
  }

  /* -------------------------- AI helpers ------------------------------- */

  private cleanNames(names: string[]): string[] {
    return Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  }

  /**
   * Ask OpenAI for a JSON list of place names (optional). Only RETURNS names —
   * the manager reviews and saves them. Without OPENAI_API_KEY (or on any
   * error) returns an empty list with a helpful message, so manual entry always
   * works. Used by the "Suggest with AI" buttons.
   */
  private async suggestNames(prompt: string): Promise<Suggestion> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        source: 'none',
        suggestions: [],
        message:
          'AI suggestions are off. Set OPENAI_API_KEY on the backend, or add entries manually.',
      };
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'You list real Indian administrative place names. Respond ONLY with a compact JSON array of strings, no prose.',
            },
            { role: 'user', content: `${prompt} JSON array of names only.` },
          ],
        }),
      });

      if (!res.ok) {
        return {
          source: 'openai',
          suggestions: [],
          message: `Suggestion service returned ${res.status}. Add entries manually.`,
        };
      }

      const json: any = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? '';
      const suggestions = this.parseNameArray(content);
      return {
        source: 'openai',
        suggestions,
        message: suggestions.length
          ? 'Review these and save the ones you want.'
          : 'No suggestions returned. Add entries manually.',
      };
    } catch {
      return {
        source: 'openai',
        suggestions: [],
        message: 'Could not reach the suggestion service. Add entries manually.',
      };
    }
  }

  private parseNameArray(content: string): string[] {
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) return [];
    try {
      const arr = JSON.parse(content.slice(start, end + 1));
      if (!Array.isArray(arr)) return [];
      return Array.from(
        new Set(
          arr
            .map((x) => (typeof x === 'string' ? x.trim() : ''))
            .filter(Boolean),
        ),
      ).slice(0, 50);
    } catch {
      return [];
    }
  }
}
