import {apiRequest} from './apiClient';
import {AREAS, findArea} from '../data/areas';
import {Area} from '../types';

export const areaService = {
  /** GET /area/score */
  getScore: (query: string): Promise<Area> =>
    apiRequest(`/area/score?q=${encodeURIComponent(query)}`, () => findArea(query)),
  list: (): Promise<Area[]> => apiRequest('/area/list', () => AREAS),
};
