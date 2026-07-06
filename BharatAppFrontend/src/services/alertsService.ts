import {apiRequest} from './apiClient';
import {LOCAL_ALERTS} from '../data/alerts';
import {UTILITY_ROWS} from '../data/utilities';
import {LocalAlert} from '../types';

export const alertsService = {
  /** GET /alerts */
  getAlerts: (): Promise<LocalAlert[]> => apiRequest('/alerts', () => LOCAL_ALERTS),
  utilities: () => apiRequest('/utilities', () => UTILITY_ROWS),
};
