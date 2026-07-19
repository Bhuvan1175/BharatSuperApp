import { Injectable, Logger } from '@nestjs/common';
import {
  CityContext,
  DistrictContext,
  LocationDataProvider,
  VillageResult,
  WardResult,
} from './location-data.types';

/**
 * "All India Pincode Directory till last month" on data.gov.in — the live,
 * maintained resource (the older 04cbe4b1… copy is retired and returns nothing).
 */
const DEFAULT_RESOURCE_ID = '5c2f62fe-5afa-4119-a499-fec9d604d5bd';

/**
 * Authoritative government-data provider backed by data.gov.in (free).
 *
 * Villages/localities come from the "All India Pincode Directory" — every post
 * office (which maps to a village/locality) with its district and state. This
 * is real Government of India data and free: you only need a free API key from
 * https://data.gov.in.
 *
 * The pincode dataset's district field name varies between copies ("district"
 * vs "districtname"), so this provider tries both automatically, in a few case
 * spellings, until one returns rows — no manual field configuration needed.
 *
 * Environment variables (all optional except the key):
 *   DATA_GOV_IN_API_KEY               (required) your free data.gov.in key
 *   DATA_GOV_IN_PINCODE_RESOURCE_ID   dataset id; defaults to the live pincode
 *                                     directory resource above
 *   DATA_GOV_IN_DISTRICT_FIELD        force a single district field name
 *                                     (otherwise "district" then "districtname")
 *   DATA_GOV_IN_STATE_FIELD           state field name; default "statename"
 *   DATA_GOV_IN_PLACE_FIELD           place/office field name; default
 *                                     "officename"
 *
 * NOTE on wards: government open data does NOT expose village-level ward names
 * and numbers uniformly, so fetchWards returns [] here. Wards fall back to the
 * next configured provider (OpenAI, if a key is set) or to manual entry.
 */
@Injectable()
export class GovtLocationProvider implements LocationDataProvider {
  readonly name = 'govt';
  private readonly logger = new Logger(GovtLocationProvider.name);

  private get apiKey(): string | undefined {
    return process.env.DATA_GOV_IN_API_KEY;
  }
  private get resourceId(): string {
    return process.env.DATA_GOV_IN_PINCODE_RESOURCE_ID || DEFAULT_RESOURCE_ID;
  }
  private get stateField(): string {
    return process.env.DATA_GOV_IN_STATE_FIELD || 'statename';
  }
  private get placeField(): string {
    return process.env.DATA_GOV_IN_PLACE_FIELD || 'officename';
  }
  /** District field name(s) to try — a forced one, else the two known spellings. */
  private districtFieldCandidates(): string[] {
    const forced = process.env.DATA_GOV_IN_DISTRICT_FIELD;
    return forced ? [forced] : ['district', 'districtname'];
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async fetchVillages(ctx: DistrictContext): Promise<VillageResult[]> {
    if (!this.apiKey) return [];
    for (const field of this.districtFieldCandidates()) {
      for (const districtValue of this.caseVariants(ctx.district)) {
        const names = await this.queryDistrict(field, districtValue, ctx.state);
        if (names.length) return names.map((name) => ({ name }));
      }
    }
    this.logger.warn(
      `data.gov.in returned no villages for "${ctx.district}, ${ctx.state}"`,
    );
    return [];
  }

  /** Government open data has no uniform ward directory — defer to other sources. */
  async fetchWards(_ctx: CityContext): Promise<WardResult[]> {
    return [];
  }

  /**
   * Resolve a 6-digit PIN code to a representative lat/long, from the same
   * pincode directory used for village auto-fill — it carries a `latitude` /
   * `longitude` field per post office.
   *
   * One PIN code commonly covers many post offices (rural India especially),
   * each with its OWN coordinates — sometimes hundreds of km apart, and
   * occasionally outright bad data. So this doesn't just take the first
   * plausible row: when a locality/city name is given, it prefers whichever
   * post office's name actually matches, and only falls back to "first
   * plausible" when nothing matches.
   */
  async fetchCoordinatesByPincode(
    pincode: string,
    context?: { localityName?: string; cityName?: string },
  ): Promise<{ latitude: number; longitude: number } | null> {
    if (!this.apiKey) return null;
    const url =
      `https://api.data.gov.in/resource/${this.resourceId}` +
      `?api-key=${encodeURIComponent(this.apiKey)}` +
      `&format=json&limit=20&filters[pincode]=${encodeURIComponent(pincode)}`;
    const records = await this.getRecords(url);

    const candidates = records
      .map((r) => ({
        place: this.cleanPlace(String(r[this.placeField] ?? '')),
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
      }))
      .filter((c) => this.isPlausibleIndianCoordinate(c.latitude, c.longitude));

    if (!candidates.length) {
      this.logger.warn(
        `data.gov.in returned no usable coordinates for pincode ${pincode}`,
      );
      return null;
    }

    const wanted = [context?.localityName, context?.cityName]
      .filter((s): s is string => !!s?.trim())
      .map((s) => s.trim().toLowerCase());

    for (const want of wanted) {
      const exact = candidates.find((c) => c.place.toLowerCase() === want);
      if (exact) return exact;
    }
    for (const want of wanted) {
      const partial = candidates.find(
        (c) =>
          c.place.toLowerCase().includes(want) ||
          want.includes(c.place.toLowerCase()),
      );
      if (partial) return partial;
    }

    return candidates[0];
  }

  /** Rejects 0/0 placeholder rows and anything outside India's rough bounding box. */
  private isPlausibleIndianCoordinate(lat: number, lon: number): boolean {
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= 6 &&
      lat <= 38 &&
      lon >= 68 &&
      lon <= 98
    );
  }

  /**
   * Page through the pincode directory filtered by a district field, collecting
   * distinct place (post-office) names. Prefers rows whose state also matches;
   * falls back to all district rows if the state spelling doesn't line up.
   */
  private async queryDistrict(
    districtField: string,
    districtValue: string,
    stateName: string,
  ): Promise<string[]> {
    const matched = new Set<string>();
    const all = new Set<string>();
    const limit = 100;
    let offset = 0;

    for (let page = 0; page < 60; page++) {
      const url =
        `https://api.data.gov.in/resource/${this.resourceId}` +
        `?api-key=${encodeURIComponent(this.apiKey as string)}` +
        `&format=json&limit=${limit}&offset=${offset}` +
        `&filters[${districtField}]=${encodeURIComponent(districtValue)}`;

      const records = await this.getRecords(url);
      if (!records || !records.length) break;

      for (const r of records) {
        const place = this.cleanPlace(String(r[this.placeField] ?? ''));
        if (!place) continue;
        all.add(place);
        const st = String(r[this.stateField] ?? '');
        if (!stateName || this.looseEq(st, stateName)) matched.add(place);
      }

      if (records.length < limit) break;
      offset += limit;
    }

    const chosen = matched.size ? matched : all;
    return Array.from(chosen);
  }

  /** GET the data.gov.in resource; returns its `records` array ([] on failure). */
  private async getRecords(url: string): Promise<Record<string, unknown>[]> {
    const controller = new AbortController();
    const ms = Number(process.env.DATA_GOV_IN_TIMEOUT_MS || 12000);
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        this.logger.warn(`data.gov.in returned ${res.status}`);
        return [];
      }
      const json: any = await res.json();
      const records = json?.records;
      return Array.isArray(records) ? records : [];
    } catch (e) {
      this.logger.warn(`data.gov.in request failed: ${(e as Error).message}`);
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  /** Strip post-office suffixes (B.O / S.O / H.O / G.P.O) to get the place name. */
  private cleanPlace(office: string): string {
    return office
      .replace(/\s*\(.*?\)\s*$/, '')
      .replace(/\s+(B\.?O|S\.?O|H\.?O|G\.?P\.?O|P\.?O)\.?$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private caseVariants(s: string): string[] {
    const t = s.trim();
    const upper = t.toUpperCase();
    const title = t.replace(
      /\w\S*/g,
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    );
    return Array.from(new Set([t, upper, title]));
  }

  private looseEq(a: string, b: string): boolean {
    return a.trim().toUpperCase() === b.trim().toUpperCase();
  }
}
