import {crowdColor, scoreLabel, eligibilityColor} from '../src/utils/helpers';
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
