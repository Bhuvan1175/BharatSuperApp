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

type Suggestion = {
  source: 'openai' | 'none';
  suggestions: string[];
  message: string;
};

/**
 * Location hierarchy: State → District → City → Locality. Shared reference data
 * for every module. Reads are open to any authenticated user; writes are
 * manager-only (any user holding a "<module>:manage" permission, or "*").
 */
@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

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
    try {
      return await this.prisma.district.create({
        data: { stateId, name: dto.name.trim() },
      });
    } catch (e) {
      this.conflict(e, 'district');
    }
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
      include: { _count: { select: { localities: true } } },
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
        data: { districtId, name: dto.name.trim() },
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
      data: names.map((name) => ({ districtId, name })),
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
    try {
      return await this.prisma.locality.create({
        data: {
          cityId,
          name: dto.name.trim(),
          pincode: dto.pincode?.trim() || null,
        },
      });
    } catch (e) {
      this.conflict(e, 'locality');
    }
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

  /* -------------------------- AI helpers ------------------------------- */

  aiStatus() {
    return { enabled: !!process.env.OPENAI_API_KEY };
  }

  private cleanNames(names: string[]): string[] {
    return Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  }

  /**
   * Ask OpenAI for a JSON list of place names (optional). Only RETURNS names —
   * the manager reviews and saves them. Without OPENAI_API_KEY (or on any
   * error) returns an empty list with a helpful message, so manual entry always
   * works.
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
