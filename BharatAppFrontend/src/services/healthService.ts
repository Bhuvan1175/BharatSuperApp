import {apiRequest} from './apiClient';
import {PHARMACIES, getGeneric} from '../data/pharmacies';
import {Pharmacy, GenericAlternative, OcrMedicineMatch} from '../types';

/** Below this confidence, the UI asks the user to confirm/edit the name. */
export const OCR_CONFIDENCE_THRESHOLD = 0.85;

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
  /** POST /health/prescription — OCR stub. Each match carries a confidence so
   * the UI can flag uncertain reads for the user to confirm/edit. */
  scanPrescription: (): Promise<OcrMedicineMatch[]> =>
    apiRequest(
      '/health/prescription',
      () => [
        {name: 'Dolo 650', confidence: 0.97},
        {name: 'Azithromycin 500', confidence: 0.91},
        {name: 'Vitamln D3', confidence: 0.62},
      ],
      {method: 'POST', latencyMs: 1600},
    ),
};
