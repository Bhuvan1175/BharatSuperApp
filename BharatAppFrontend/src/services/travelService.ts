import {apiRequest} from './apiClient';
import {FUEL_STATIONS} from '../data/fuelStations';
import {ROAD_TRIP_STOPS} from '../data/roadtrip';
import {FuelStation, FuelType, RoadTripStop} from '../types';

const crowdRank = (l: string): number => (l === 'low' ? 0 : l === 'medium' ? 1 : 2);

export const travelService = {
  /** GET /travel/stations — sorted least-crowded first */
  getStations: (filter?: FuelType): Promise<FuelStation[]> =>
    apiRequest('/travel/stations', () =>
      FUEL_STATIONS.filter(s => !filter || s.fuelTypes.includes(filter)).sort(
        (a, b) => crowdRank(a.crowdLevel) - crowdRank(b.crowdLevel) || a.distanceKm - b.distanceKm,
      ),
    ),
  /** POST /travel/roadtrip */
  planRoadTrip: (route: string): Promise<RoadTripStop[]> =>
    apiRequest(`/travel/roadtrip?route=${encodeURIComponent(route)}`, () => ROAD_TRIP_STOPS, {
      method: 'POST',
      latencyMs: 1400,
    }),
};
