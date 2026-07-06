import {apiRequest} from './apiClient';
import {PHARMACIES, getGeneric} from '../data/pharmacies';
import {Pharmacy, GenericAlternative} from '../types';

export const healthService = {
  /** GET /health/medicine */
  findMedicine: (name: string): Promise<Pharmacy[]> =>
    apiRequest(`/health/medicine?name=${encodeURIComponent(name)}`, () =>
      PHARMACIES.filter(p =>
        p.stock.some(s => s.medicine.toLowerCase().includes(name.toLowerCase())) ||
        name.trim().length === 0,
      ),
    ),
  genericFor: (name: string): Promise<GenericAlternative> =>
    apiRequest('/health/generic', () => getGeneric(name)),
  /** POST /health/prescription — OCR stub */
  scanPrescription: (): Promise<string[]> =>
    apiRequest('/health/prescription', () => ['Dolo 650', 'Azithromycin 500', 'Vitamin D3'], {
      method: 'POST',
      latencyMs: 1600,
    }),
};
