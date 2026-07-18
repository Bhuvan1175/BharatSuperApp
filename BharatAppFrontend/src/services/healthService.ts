/**
 * NOTE: the mock `findMedicine`/`genericFor` methods that used to live here
 * (backed by data/pharmacies.ts fake multi-pharmacy data) have been removed.
 * The Health screen now searches the real Medicine Store catalogue directly
 * via useMedicines()/useMedicineStore() (src/hooks/useMedicines.ts) — there's
 * only one real store in this app's data model, not a pharmacy comparison.
 *
 * Prescription scanning has moved to services/prescriptionOcr.ts (real
 * on-device OCR + matching against the real catalogue, not a mock).
 *
 * data/pharmacies.ts itself is still used — by the AI chat demo
 * (services/aiService.ts) — so it hasn't been deleted.
 */
export {};
