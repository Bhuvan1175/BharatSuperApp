import {classifyIntent} from '../src/services/aiService';

describe('AI intent classification', () => {
  it('routes medicine queries to health', () => {
    expect(classifyIntent('Find Dolo 650 near me')).toBe('health');
  });
  it('routes area queries to area', () => {
    expect(classifyIntent('Is Baner a safe area to buy a house?')).toBe('area');
  });
  it('routes scheme queries to government', () => {
    expect(classifyIntent('Am I eligible for a housing scheme?')).toBe('government');
  });
  it('routes fuel queries to travel', () => {
    expect(classifyIntent('least crowded petrol pump nearby')).toBe('travel');
  });
  it('routes power/water queries to utility', () => {
    expect(classifyIntent('any power cuts in my area today?')).toBe('utility');
  });
  it('routes distress queries to emergency', () => {
    expect(classifyIntent('call an ambulance')).toBe('emergency');
  });
  it('falls back to general for off-domain queries', () => {
    expect(classifyIntent('what is the weather on mars')).toBe('general');
  });
});
