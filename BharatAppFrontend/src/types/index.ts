/**
 * Shared domain models — mirror the data model in the Product & Technical
 * Documentation (§8) and the AI response contract (§5).
 */

export type LanguageCode = 'en' | 'hi';
export type ThemeMode = 'light' | 'dark';
export type CrowdLevel = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  phone: string;
  location: string;
  language: LanguageCode;
  theme: ThemeMode;
  aiPersonality: AIPersonality;
  avatar?: string;
  savedItems: SavedItems;
}

export type AIPersonality = 'friendly' | 'concise' | 'formal' | 'detailed';

export interface SavedItems {
  medicines: string[];
  areas: string[];
  routes: string[];
  schemes: string[];
}

/* ---------- AI assistant ---------- */
export type Domain =
  | 'area'
  | 'health'
  | 'government'
  | 'travel'
  | 'utility'
  | 'emergency'
  | 'general';

export type MessageRole = 'user' | 'assistant';

export interface CTAAction {
  id: string;
  label: string;
  icon: string;
  type: 'directions' | 'apply' | 'view' | 'remind' | 'call' | 'compare';
  target?: string; // deep-link target module
  payload?: Record<string, unknown>;
}

export type RichCard =
  | {kind: 'area'; data: Area}
  | {kind: 'pharmacies'; data: Pharmacy[]}
  | {kind: 'scheme'; data: Scheme}
  | {kind: 'fuel'; data: FuelStation[]}
  | {kind: 'comparison'; data: ComparisonCard};

export interface ComparisonCard {
  title: string;
  optionA: {name: string; score: number; highlights: string[]};
  optionB: {name: string; score: number; highlights: string[]};
  recommendation: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  cards?: RichCard[];
  actions?: CTAAction[];
  sources?: string[];
  confidence?: number;
  createdAt: number;
  pending?: boolean;
}

/* ---------- Area intelligence ---------- */
export interface AreaCategory {
  key: 'safety' | 'health' | 'schools' | 'internet' | 'waterPower' | 'traffic';
  label: string;
  icon: string;
  score: number; // 0-10
  summary: string;
}

export interface Area {
  id: string;
  name: string;
  city: string;
  score: number; // 0-10
  label: string; // e.g. Excellent
  categories: AreaCategory[];
  property: {
    avgRent: string;
    avgPrice: string;
    priceGrowth: string;
    builderRating: number;
  };
  nearby: {hospitals: number; schools: number; police: number; atms: number};
  aiSummary: string;
}

/* ---------- Health ---------- */
export interface StockItem {
  medicine: string;
  price: number;
  available: boolean;
}

export interface Pharmacy {
  id: string;
  name: string;
  distanceKm: number;
  hours: string;
  open: boolean;
  rating: number;
  stock: StockItem[];
}

export interface GenericAlternative {
  name: string;
  price: number;
  savingPct: number;
  dosageNote: string;
}

/** One medicine name extracted from a scanned prescription (real on-device OCR). */
export interface OcrMedicineMatch {
  name: string;
  /** 0–1 confidence, from how well the OCR'd line matches a real catalogue
   * medicine. Below the "unsure" threshold, the UI asks the user to
   * confirm/edit the name before searching. */
  confidence: number;
  /** Set when `name` was matched to a real medicine in the store's catalogue. */
  medicineId?: string;
}

/* ---------- Government ---------- */
export type SchemeCategory =
  | 'Scholarships'
  | 'Pension'
  | 'Housing'
  | 'Farmer'
  | 'Startup'
  | 'Women'
  | 'Senior Citizen';

export type EligibilityStatus = 'eligible' | 'maybe' | 'ineligible';

export interface Scheme {
  id: string;
  name: string;
  category: SchemeCategory;
  benefit: string;
  eligibilityStatus: EligibilityStatus;
  requiredDocs: string[];
  applyUrl: string;
  description: string;
}

export interface EligibilityProfile {
  age: string;
  occupation: string;
  income: string;
  state: string;
  gender: string;
}

/* ---------- Travel / Fuel ---------- */
export type FuelType = 'Petrol' | 'CNG' | 'EV' | 'Parking' | 'Toilets';

export interface FuelStation {
  id: string;
  name: string;
  brand: string;
  distanceKm: number;
  price: number; // price/L
  rating: number;
  crowdLevel: CrowdLevel;
  fuelTypes: FuelType[];
  open: boolean;
}

export interface RoadTripStop {
  id: string;
  type: 'fuel' | 'food' | 'ev' | 'stay' | 'attraction';
  name: string;
  detail: string;
  distanceKm: number;
}

/* ---------- Alerts / Utilities ---------- */
export type AlertType = 'water' | 'power' | 'traffic';
export interface LocalAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  area: string;
  window: {from: string; to: string};
  severity: 'low' | 'medium' | 'high';
}

/* ---------- Emergency ---------- */
export interface EmergencyContact {
  id: string;
  label: string;
  number: string;
  icon: string;
  color: string;
}

export interface NearbyHelp {
  id: string;
  name: string;
  type: 'hospital' | 'blood_bank' | 'police';
  distanceKm: number;
}

/* ---------- Misc ---------- */
export interface QuickAction {
  id: string;
  labelKey: string;
  icon: string;
  color: string;
  route: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  at: number;
}
