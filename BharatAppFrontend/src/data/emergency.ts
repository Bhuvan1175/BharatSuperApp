import {EmergencyContact, NearbyHelp} from '../types';
import {palette} from '../theme/colors';

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {id: 'amb', label: 'Ambulance', number: '108', icon: 'plus-square', color: palette.alertRed},
  {id: 'pol', label: 'Police', number: '100', icon: 'shield', color: palette.royalBlue},
  {id: 'fire', label: 'Fire', number: '101', icon: 'thermometer', color: palette.saffron},
  {id: 'women', label: 'Women Helpline', number: '1091', icon: 'heart', color: '#EC4899'},
];

export const NEARBY_HELP: NearbyHelp[] = [
  {id: 'n1', name: 'Jupiter Hospital', type: 'hospital', distanceKm: 1.2},
  {id: 'n2', name: 'Sahyadri Blood Bank', type: 'blood_bank', distanceKm: 2.0},
  {id: 'n3', name: 'Chatushrungi Police Station', type: 'police', distanceKm: 2.4},
  {id: 'n4', name: 'Aditya Birla Hospital', type: 'hospital', distanceKm: 3.1},
];
