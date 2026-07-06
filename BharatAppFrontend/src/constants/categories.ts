import {SchemeCategory, FuelType} from '../types';

export const SCHEME_CATEGORIES: {key: SchemeCategory; icon: string}[] = [
  {key: 'Scholarships', icon: 'book-open'},
  {key: 'Pension', icon: 'umbrella'},
  {key: 'Housing', icon: 'home'},
  {key: 'Farmer', icon: 'sun'},
  {key: 'Startup', icon: 'trending-up'},
  {key: 'Women', icon: 'heart'},
  {key: 'Senior Citizen', icon: 'user-check'},
];

export const FUEL_CATEGORIES: {key: FuelType; icon: string}[] = [
  {key: 'Petrol', icon: 'droplet'},
  {key: 'CNG', icon: 'wind'},
  {key: 'EV', icon: 'battery-charging'},
  {key: 'Parking', icon: 'square'},
  {key: 'Toilets', icon: 'home'},
];

export const INDIAN_STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh',
  'Gujarat', 'Rajasthan', 'West Bengal', 'Telangana', 'Kerala',
  'Madhya Pradesh', 'Bihar', 'Punjab', 'Haryana', 'Other',
];

export const OCCUPATIONS = [
  'Student', 'Farmer', 'Salaried', 'Self-employed', 'Homemaker',
  'Unemployed', 'Retired', 'Business owner',
];

export const GENDERS = ['Female', 'Male', 'Other'];
