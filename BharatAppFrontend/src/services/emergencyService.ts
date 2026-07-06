import {apiRequest} from './apiClient';
import {EMERGENCY_CONTACTS, NEARBY_HELP} from '../data/emergency';
import {EmergencyContact, NearbyHelp} from '../types';

export const emergencyService = {
  contacts: (): EmergencyContact[] => EMERGENCY_CONTACTS,
  nearby: (): Promise<NearbyHelp[]> =>
    apiRequest('/emergency/nearby', () =>
      [...NEARBY_HELP].sort((a, b) => a.distanceKm - b.distanceKm),
    ),
  /** POST /emergency/sos — broadcast location to 112 + contacts */
  broadcastSos: (): Promise<{ok: boolean; sharedWith: string[]}> =>
    apiRequest('/emergency/sos', () => ({ok: true, sharedWith: ['112', 'Priya (mom)', 'Rahul']}), {
      method: 'POST',
      latencyMs: 500,
    }),
};
