import {FuelStation} from '../types';

export const FUEL_STATIONS: FuelStation[] = [
  {id: 'f1', name: 'HP Petrol Pump', brand: 'HPCL', distanceKm: 0.6, price: 106.3, rating: 4.4, crowdLevel: 'low', fuelTypes: ['Petrol', 'CNG'], open: true},
  {id: 'f2', name: 'Indian Oil COCO', brand: 'IOCL', distanceKm: 1.1, price: 105.9, rating: 4.2, crowdLevel: 'medium', fuelTypes: ['Petrol', 'Toilets'], open: true},
  {id: 'f3', name: 'Tata Power EZ Charge', brand: 'Tata Power', distanceKm: 1.4, price: 21.0, rating: 4.6, crowdLevel: 'low', fuelTypes: ['EV', 'Parking'], open: true},
  {id: 'f4', name: 'Bharat Petroleum', brand: 'BPCL', distanceKm: 1.9, price: 106.1, rating: 4.0, crowdLevel: 'high', fuelTypes: ['Petrol', 'CNG', 'Toilets'], open: true},
  {id: 'f5', name: 'MGL CNG Station', brand: 'MGL', distanceKm: 2.3, price: 76.5, rating: 4.1, crowdLevel: 'medium', fuelTypes: ['CNG'], open: true},
  {id: 'f6', name: 'Smart Parking Plaza', brand: 'Park+', distanceKm: 0.8, price: 40.0, rating: 4.3, crowdLevel: 'low', fuelTypes: ['Parking', 'Toilets'], open: true},
];
