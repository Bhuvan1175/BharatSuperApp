import {Area} from '../types';

export const AREAS: Area[] = [
  {
    id: 'baner',
    name: 'Baner',
    city: 'Pune',
    score: 8.4,
    label: 'Excellent',
    categories: [
      {key: 'safety', label: 'Safety', icon: 'shield', score: 8.6, summary: 'Low crime, well-lit main roads and active society patrols.'},
      {key: 'health', label: 'Health', icon: 'activity', score: 8.2, summary: '3 multi-speciality hospitals and many clinics within 3 km.'},
      {key: 'schools', label: 'Schools', icon: 'book-open', score: 8.0, summary: 'Reputed CBSE/ICSE schools and pre-schools nearby.'},
      {key: 'internet', label: 'Internet', icon: 'wifi', score: 9.0, summary: 'Fibre from 4 providers; average 200+ Mbps.'},
      {key: 'waterPower', label: 'Water & Power', icon: 'zap', score: 7.4, summary: 'Reliable supply; occasional summer water tankers.'},
      {key: 'traffic', label: 'Traffic', icon: 'navigation', score: 6.8, summary: 'Peak-hour congestion on Baner Road; metro coming.'},
    ],
    property: {avgRent: '₹28,000/mo', avgPrice: '₹11,200/sqft', priceGrowth: '+8.2% YoY', builderRating: 4.3},
    nearby: {hospitals: 6, schools: 14, police: 2, atms: 22},
    aiSummary:
      'Baner is a premium, well-connected suburb with strong safety, health and internet scores. Great for professionals and families; watch peak-hour traffic on the main road.',
  },
  {
    id: 'wakad',
    name: 'Wakad',
    city: 'Pune',
    score: 7.8,
    label: 'Very good',
    categories: [
      {key: 'safety', label: 'Safety', icon: 'shield', score: 7.9, summary: 'Generally safe; growing residential density.'},
      {key: 'health', label: 'Health', icon: 'activity', score: 7.6, summary: 'Good hospital access near Hinjewadi corridor.'},
      {key: 'schools', label: 'Schools', icon: 'book-open', score: 7.5, summary: 'Several schools; some at capacity.'},
      {key: 'internet', label: 'Internet', icon: 'wifi', score: 8.7, summary: 'Strong fibre coverage from IT corridor.'},
      {key: 'waterPower', label: 'Water & Power', icon: 'zap', score: 7.2, summary: 'Stable supply across most societies.'},
      {key: 'traffic', label: 'Traffic', icon: 'navigation', score: 6.2, summary: 'Heavy IT-commute traffic toward Hinjewadi.'},
    ],
    property: {avgRent: '₹24,000/mo', avgPrice: '₹9,400/sqft', priceGrowth: '+9.1% YoY', builderRating: 4.1},
    nearby: {hospitals: 5, schools: 11, police: 2, atms: 18},
    aiSummary:
      'Wakad offers better value than Baner with slightly lower scores. Ideal if you work in Hinjewadi, but expect commute-time traffic.',
  },
  {
    id: 'kothrud',
    name: 'Kothrud',
    city: 'Pune',
    score: 8.1,
    label: 'Excellent',
    categories: [
      {key: 'safety', label: 'Safety', icon: 'shield', score: 8.5, summary: 'Established, family-friendly neighbourhood.'},
      {key: 'health', label: 'Health', icon: 'activity', score: 8.3, summary: 'Dense hospital and clinic coverage.'},
      {key: 'schools', label: 'Schools', icon: 'book-open', score: 8.4, summary: 'Top-rated schools and colleges.'},
      {key: 'internet', label: 'Internet', icon: 'wifi', score: 8.2, summary: 'Reliable broadband options.'},
      {key: 'waterPower', label: 'Water & Power', icon: 'zap', score: 7.8, summary: 'Consistent municipal supply.'},
      {key: 'traffic', label: 'Traffic', icon: 'navigation', score: 6.5, summary: 'Busy but well-served by buses and metro.'},
    ],
    property: {avgRent: '₹26,000/mo', avgPrice: '₹12,000/sqft', priceGrowth: '+6.4% YoY', builderRating: 4.4},
    nearby: {hospitals: 7, schools: 16, police: 3, atms: 25},
    aiSummary:
      'Kothrud is a mature, highly-rated area with excellent schools and healthcare — a top choice for families prioritising stability.',
  },
];

export const findArea = (query: string): Area => {
  const q = query.toLowerCase();
  return AREAS.find(a => q.includes(a.name.toLowerCase())) ?? AREAS[0];
};
