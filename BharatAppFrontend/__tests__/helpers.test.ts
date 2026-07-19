import {
  crowdColor,
  scoreLabel,
  eligibilityColor,
  formatJobType,
  computePriceGrowthPct,
  averageBuilderRating,
} from '../src/utils/helpers';
import {formatDistance, formatPrice, interpolate} from '../src/utils/format';

describe('helpers', () => {
  it('maps crowd levels to colours', () => {
    expect(crowdColor('low')).toBe('#22C55E');
    expect(crowdColor('high')).toBe('#FF3B30');
  });
  it('labels scores', () => {
    expect(scoreLabel(8.6)).toBe('Excellent');
    expect(scoreLabel(3)).toBe('Below average');
  });
  it('colours eligibility', () => {
    expect(eligibilityColor('eligible')).toBe('#22C55E');
  });
  it('title-cases a background job type', () => {
    expect(formatJobType('AREA_MASTER_SYNC')).toBe('Area Master Sync');
    expect(formatJobType('SCORE_RECALC')).toBe('Score Recalc');
  });
  it('computes price growth % between the last two history points', () => {
    expect(
      computePriceGrowthPct([{avgPrice: 100}, {avgPrice: 110}]),
    ).toBeCloseTo(10);
    expect(
      computePriceGrowthPct([{avgPrice: 100}, {avgPrice: 90}]),
    ).toBeCloseTo(-10);
    expect(computePriceGrowthPct([{avgPrice: 100}])).toBeNull();
    expect(computePriceGrowthPct([])).toBeNull();
  });
  it('averages builder ratings, ignoring nulls', () => {
    expect(averageBuilderRating([{rating: 4}, {rating: 5}])).toBe(4.5);
    expect(averageBuilderRating([{rating: null}, {rating: 4}])).toBe(4);
    expect(averageBuilderRating([{rating: null}])).toBeNull();
    expect(averageBuilderRating([])).toBeNull();
  });
});

describe('formatters', () => {
  it('formats distance', () => {
    expect(formatDistance(0.4)).toBe('400 m');
    expect(formatDistance(1.3)).toBe('1.3 km');
  });
  it('formats price in INR', () => {
    expect(formatPrice(32)).toContain('32');
  });
  it('interpolates templates', () => {
    expect(interpolate('Save {pct}%', {pct: 56})).toBe('Save 56%');
  });
});
