/**
 * AI assistant engine (client-side prototype).
 *
 * Implements the query lifecycle from the spec (§5): intent classification →
 * context assembly → data retrieval → reason/rank → typed response contract
 * { text, cards[], actions[], sources[], confidence }.
 *
 * In production, this maps to POST (stream) /ai/query. Here it routes to the
 * local mock services and synthesises a friendly answer with rich cards.
 */
import {Domain, ChatMessage, RichCard, CTAAction} from '../types';
import {findArea, AREAS} from '../data/areas';
import {PHARMACIES, getGeneric} from '../data/pharmacies';
import {SCHEMES} from '../data/schemes';
import {FUEL_STATIONS} from '../data/fuelStations';
import {uid, wait} from '../utils/helpers';
import {APP_CONFIG} from '../constants/config';

export interface AIResponse {
  text: string;
  cards?: RichCard[];
  actions?: CTAAction[];
  sources?: string[];
  confidence: number;
}

const KEYWORDS: Record<Exclude<Domain, 'general'>, string[]> = {
  health: ['medicine', 'medicines', 'pharmacy', 'dolo', 'tablet', 'dosage', 'prescription', 'chemist', 'paracetamol'],
  area: ['area', 'safe', 'baner', 'wakad', 'kothrud', 'neighbourhood', 'neighborhood', 'buy a house', 'rent', 'locality', 'compare'],
  government: ['scheme', 'schemes', 'eligible', 'eligibility', 'pension', 'scholarship', 'housing', 'subsidy', 'pmay', 'awas'],
  travel: ['fuel', 'petrol', 'pump', 'cng', 'ev', 'charger', 'parking', 'crowd', 'road trip', 'roadtrip', 'diesel'],
  utility: ['power cut', 'power', 'electricity', 'water', 'outage', 'load shedding', 'tanker'],
  emergency: ['emergency', 'ambulance', 'police', 'fire', 'sos', 'help', 'accident'],
};

/** Step 3 — intent classification. */
export const classifyIntent = (query: string): Domain => {
  const q = query.toLowerCase();
  const scores = (Object.keys(KEYWORDS) as (keyof typeof KEYWORDS)[]).map(domain => ({
    domain,
    score: KEYWORDS[domain].filter(k => q.includes(k)).length,
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0].score > 0 ? scores[0].domain : 'general';
};

const action = (
  id: string,
  label: string,
  icon: string,
  type: CTAAction['type'],
  target?: string,
): CTAAction => ({id, label, icon, type, target});

/** Steps 5-8 — retrieve, reason/rank, build rich result cards + actions. */
const build = (domain: Domain, query: string): AIResponse => {
  switch (domain) {
    case 'health': {
      const withStock = PHARMACIES.filter(p => p.stock.some(s => s.available)).slice(0, 3);
      const generic = getGeneric('dolo 650');
      return {
        text: `I found ${withStock.length} nearby pharmacies stocking your medicine. Apollo Pharmacy is closest (0.4 km) at ₹32. A generic option, ${generic.name}, costs ₹${generic.price} — about ${generic.savingPct}% cheaper.`,
        cards: [{kind: 'pharmacies', data: withStock}],
        actions: [action('a1', 'Open Health', 'plus-square', 'view', 'Health'), action('a2', 'Directions', 'navigation', 'directions', 'Health')],
        sources: ['Apollo Pharmacy', 'MedPlus', '1mg price index'],
        confidence: 0.92,
      };
    }
    case 'area': {
      const area = findArea(query);
      return {
        text: `${area.name}, ${area.city} scores ${area.score}/10 — ${area.label}. ${area.aiSummary}`,
        cards: [{kind: 'area', data: area}],
        actions: [action('a1', 'View area', 'map-pin', 'view', 'ExploreTab'), action('a2', 'Compare areas', 'bar-chart-2', 'compare', 'ExploreTab')],
        sources: ['Area Intelligence index', 'Municipal open data'],
        confidence: 0.9,
      };
    }
    case 'government': {
      const eligible = SCHEMES.filter(s => s.eligibilityStatus !== 'ineligible').slice(0, 1);
      return {
        text: `Based on a typical profile, you likely qualify for ${eligible[0].name}: ${eligible[0].benefit}. Tap Apply to start with the required documents checklist.`,
        cards: [{kind: 'scheme', data: eligible[0]}],
        actions: [action('a1', 'Check eligibility', 'clipboard', 'view', 'GovernmentTab'), action('a2', 'Apply', 'external-link', 'apply', 'GovernmentTab')],
        sources: ['MyScheme.gov.in', 'PMAY portal'],
        confidence: 0.84,
      };
    }
    case 'travel': {
      const stations = [...FUEL_STATIONS].sort((a, b) => (a.crowdLevel === 'low' ? -1 : 1)).slice(0, 3);
      return {
        text: `The least-crowded pump near you is ${stations[0].name} (${stations[0].distanceKm} km) at ₹${stations[0].price}/L with low crowd right now. Here are the top 3, sorted least-crowded first.`,
        cards: [{kind: 'fuel', data: stations}],
        actions: [action('a1', 'Open Travel', 'droplet', 'view', 'TravelTab'), action('a2', 'Directions', 'navigation', 'directions', 'TravelTab')],
        sources: ['Live crowd estimates', 'Daily fuel price feed'],
        confidence: 0.88,
      };
    }
    case 'utility':
      return {
        text: 'There is a scheduled power cut in Baner today from 2:00 PM to 4:30 PM (MSEDCL maintenance). Water supply near Pashan Road has low pressure until 1:00 PM. Want me to remind you before the power cut?',
        actions: [action('a1', 'Set reminder', 'bell', 'remind', 'Utilities'), action('a2', 'View utilities', 'zap', 'view', 'Utilities')],
        sources: ['MSEDCL', 'PMC water board'],
        confidence: 0.86,
      };
    case 'emergency':
      return {
        text: 'If this is an emergency, tap to call now. Ambulance is 108, Police 100, Fire 101. I can also share your live location with 112 and your emergency contacts.',
        actions: [action('a1', 'Call Ambulance', 'phone', 'call', 'Emergency'), action('a2', 'Open Emergency', 'alert-triangle', 'view', 'Emergency')],
        sources: ['112 India'],
        confidence: 0.95,
      };
    default:
      return {
        text: "I can help with medicines & pharmacies, area intelligence, government schemes, fuel & travel, utilities (power/water), and emergencies. Try asking “Find Dolo 650 near me” or “Is Baner a safe area?”",
        confidence: 0.4,
      };
  }
};

export const aiService = {
  classifyIntent,
  /** Full query → typed AI response, with realistic latency. */
  async ask(query: string): Promise<AIResponse> {
    await wait(APP_CONFIG.aiResponseDelayMs);
    const domain = classifyIntent(query);
    return build(domain, query);
  },
  /** Build a comparison answer (E2-S5): "Baner vs Wakad". */
  async compare(a: string, b: string): Promise<AIResponse> {
    await wait(APP_CONFIG.aiResponseDelayMs);
    const areaA = findArea(a);
    const areaB = findArea(b) === areaA ? AREAS[1] : findArea(b);
    const winner = areaA.score >= areaB.score ? areaA : areaB;
    return {
      text: `${areaA.name} (${areaA.score}) vs ${areaB.name} (${areaB.score}). If budget isn't a constraint, ${winner.name} scores higher overall on safety and health. ${areaB.name} offers better value per sqft.`,
      cards: [
        {
          kind: 'comparison',
          data: {
            title: `${areaA.name} vs ${areaB.name}`,
            optionA: {name: areaA.name, score: areaA.score, highlights: [areaA.label, areaA.property.avgPrice]},
            optionB: {name: areaB.name, score: areaB.score, highlights: [areaB.label, areaB.property.avgPrice]},
            recommendation: `Recommended: ${winner.name} — higher overall score with stronger safety & health.`,
          },
        },
      ],
      sources: ['Area Intelligence index'],
      confidence: 0.87,
    };
  },
};

/** Helper to wrap an AIResponse into a chat message. */
export const toAssistantMessage = (res: AIResponse): ChatMessage => ({
  id: uid('msg'),
  role: 'assistant',
  text: res.text,
  cards: res.cards,
  actions: res.actions,
  sources: res.sources,
  confidence: res.confidence,
  createdAt: Date.now(),
});
