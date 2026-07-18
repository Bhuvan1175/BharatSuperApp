/**
 * Location-data provider contract.
 *
 * The app auto-fills villages (cities) and wards from an external source. This
 * interface abstracts that source so the implementation can be swapped without
 * touching the rest of the app:
 *   - OpenAiLocationProvider  → uses an LLM (fast, works anywhere, but the data
 *     must be reviewed for accuracy).
 *   - GovtLocationProvider    → slot for authoritative government data
 *     (LGD / Census / data.gov.in). Not configured out of the box.
 *
 * Which provider is active is decided by LocationDataService from the
 * LOCATION_DATA_PROVIDER env var (default: "auto").
 */

export interface VillageResult {
  /** Village / city / town name. */
  name: string;
}

export interface WardResult {
  /** Ward number as a string ("1", "12", "4A"). */
  number: string;
  /** Ward name. Falls back to "Ward <n>" when a real name is unknown. */
  name: string;
}

export interface DistrictContext {
  state: string;
  district: string;
}

export interface CityContext {
  state: string;
  district: string;
  city: string;
}

export interface LocationDataProvider {
  /** Stable provider id, stored on rows as `source`: "openai" | "govt" | "none". */
  readonly name: string;

  /** True when the provider has everything it needs (API keys, etc.). */
  isConfigured(): boolean;

  /** Every village / city / town under a district. */
  fetchVillages(ctx: DistrictContext): Promise<VillageResult[]>;

  /** Every ward (number + name) for one village / city. */
  fetchWards(ctx: CityContext): Promise<WardResult[]>;
}
