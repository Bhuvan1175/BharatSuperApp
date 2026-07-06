import {Pharmacy, GenericAlternative} from '../types';

export const PHARMACIES: Pharmacy[] = [
  {
    id: 'ph1', name: 'Apollo Pharmacy', distanceKm: 0.4, hours: '8:00 AM – 11:00 PM', open: true, rating: 4.5,
    stock: [{medicine: 'Dolo 650', price: 32, available: true}, {medicine: 'Azithromycin 500', price: 84, available: true}],
  },
  {
    id: 'ph2', name: 'MedPlus', distanceKm: 0.9, hours: '9:00 AM – 10:00 PM', open: true, rating: 4.3,
    stock: [{medicine: 'Dolo 650', price: 30, available: true}, {medicine: 'Azithromycin 500', price: 80, available: false}],
  },
  {
    id: 'ph3', name: 'Wellness Forever', distanceKm: 1.3, hours: '24 hours', open: true, rating: 4.6,
    stock: [{medicine: 'Dolo 650', price: 33, available: true}],
  },
  {
    id: 'ph4', name: 'Noble Chemist', distanceKm: 2.1, hours: '9:30 AM – 9:30 PM', open: false, rating: 4.1,
    stock: [{medicine: 'Dolo 650', price: 31, available: true}],
  },
];

export const GENERIC_ALTERNATIVES: Record<string, GenericAlternative> = {
  'dolo 650': {name: 'Paracetamol 650 (generic)', price: 14, savingPct: 56, dosageNote: '1 tablet every 6 hours after food; max 3/day. Do not exceed 3 days without advice.'},
  default: {name: 'Generic equivalent', price: 18, savingPct: 45, dosageNote: 'Follow the dosage on the label or as advised by your doctor.'},
};

export const getGeneric = (name: string): GenericAlternative =>
  GENERIC_ALTERNATIVES[name.toLowerCase()] ?? GENERIC_ALTERNATIVES.default;
