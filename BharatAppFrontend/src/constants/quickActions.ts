import {QuickAction} from '../types';
import {palette} from '../theme/colors';

/**
 * Home quick actions (spec §6.1): Medicines, Fuel, Area, Schemes, Electricity,
 * Explore, Water, Emergency. Each deep-links to its module.
 */
export const QUICK_ACTIONS: QuickAction[] = [
  {id: 'medicines', labelKey: 'Medicines', icon: 'plus-square', color: palette.emerald, route: 'Health'},
  {id: 'fuel', labelKey: 'Fuel', icon: 'droplet', color: palette.saffron, route: 'TravelTab'},
  {id: 'area', labelKey: 'Area', icon: 'map-pin', color: palette.royalBlue, route: 'ExploreTab'},
  {id: 'schemes', labelKey: 'Schemes', icon: 'award', color: '#8B5CF6', route: 'GovernmentTab'},
  {id: 'electricity', labelKey: 'Electricity', icon: 'zap', color: palette.amber, route: 'Utilities'},
  {id: 'explore', labelKey: 'Explore', icon: 'compass', color: '#0EA5E9', route: 'ExploreTab'},
  {id: 'water', labelKey: 'Water', icon: 'droplet', color: '#06B6D4', route: 'Utilities'},
  {id: 'emergency', labelKey: 'Emergency', icon: 'alert-triangle', color: palette.alertRed, route: 'Emergency'},
];
