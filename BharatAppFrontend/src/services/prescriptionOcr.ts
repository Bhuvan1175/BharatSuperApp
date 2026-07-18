import TextRecognition from '@react-native-ml-kit/text-recognition';
import {Medicine} from '../api/medicines.api';
import {OcrMedicineMatch} from '../types';
import {bestMatch} from '../utils/textSimilarity';

/**
 * Real, on-device prescription scanning (Google ML Kit — no cloud API, no
 * API key, image never leaves the phone). Replaces the old mock
 * healthService.scanPrescription().
 *
 * At/above this catalogue-match confidence, the extracted line is treated as
 * a confirmed real medicine (its catalogue name is used verbatim). Below it,
 * the raw OCR text is kept and the UI asks the user to confirm/edit — this is
 * the "OCR is unsure" path.
 */
export const OCR_CONFIDENCE_THRESHOLD = 0.72;

/** Lines shorter than this, or with too few letters, are OCR noise (rules, borders, stray marks). */
const MIN_LINE_LETTERS = 3;
/** Cap so a busy/noisy scan doesn't dump dozens of junk rows on the user. */
const MAX_RESULTS = 8;

const hasEnoughLetters = (line: string): boolean =>
  (line.match(/[a-zA-Z]/g)?.length ?? 0) >= MIN_LINE_LETTERS;

const titleCase = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();

/**
 * Recognizes text in a prescription photo and matches each candidate line
 * against the store's real medicine catalogue.
 *
 * @param imageUri  local file URI from the camera/gallery picker
 * @param catalog   the store's active medicines (from useMedicines())
 */
export async function scanPrescriptionImage(
  imageUri: string,
  catalog: Medicine[],
): Promise<OcrMedicineMatch[]> {
  const result = await TextRecognition.recognize(imageUri);

  // Prefer per-line blocks (one line per prescription row); fall back to
  // splitting the flat text if the block structure is empty for some reason.
  const rawLines: string[] =
    result.blocks?.flatMap(b => b.lines?.map(l => l.text) ?? [b.text]) ??
    result.text.split('\n');

  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const raw of rawLines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line || !hasEnoughLetters(line)) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(line);
  }

  const matches: OcrMedicineMatch[] = candidates.map(line => {
    const nameMatch = bestMatch(line, catalog, m => m.name);
    const genericMatch = bestMatch(
      line,
      catalog.filter(m => !!m.genericName),
      m => m.genericName as string,
    );
    const top =
      genericMatch && (!nameMatch || genericMatch.score > nameMatch.score)
        ? genericMatch
        : nameMatch;

    if (top && top.score >= OCR_CONFIDENCE_THRESHOLD) {
      return {name: top.item.name, confidence: top.score, medicineId: top.item.id};
    }
    return {name: titleCase(line), confidence: top?.score ?? 0};
  });

  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_RESULTS);
}
