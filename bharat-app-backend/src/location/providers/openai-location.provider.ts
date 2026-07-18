import { Injectable, Logger } from '@nestjs/common';
import {
  CityContext,
  DistrictContext,
  LocationDataProvider,
  VillageResult,
  WardResult,
} from './location-data.types';

/**
 * OpenAI-backed location data. Asks the model for a JSON object of villages or
 * wards. Fast and works for any area of India, but LLM output can be incomplete
 * or partly inaccurate — the manager reviews/edits the saved data.
 *
 * Requires OPENAI_API_KEY. Model is configurable via OPENAI_MODEL
 * (default: gpt-4o-mini).
 */
@Injectable()
export class OpenAiLocationProvider implements LocationDataProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiLocationProvider.name);

  private get apiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }
  private get model(): string {
    return process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async fetchVillages(ctx: DistrictContext): Promise<VillageResult[]> {
    const content = await this.chat(
      'You list real Indian administrative places. Respond ONLY with JSON.',
      `List the villages, towns and cities in ${ctx.district} district, ` +
        `${ctx.state}, India. Include as many real ones as you know. ` +
        `Respond as JSON: {"villages": ["Name 1", "Name 2", ...]}.`,
    );
    const arr = this.pickArray(content, 'villages');
    const seen = new Set<string>();
    const out: VillageResult[] = [];
    for (const item of arr) {
      const name = typeof item === 'string' ? item.trim() : '';
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name });
    }
    return out;
  }

  async fetchWards(ctx: CityContext): Promise<WardResult[]> {
    const content = await this.chat(
      'You list real Indian local-government wards. Respond ONLY with JSON.',
      `List the wards of ${ctx.city}, ${ctx.district} district, ${ctx.state}, ` +
        `India, with each ward's number and name. If a real name is unknown, ` +
        `use "Ward <number>". Respond as JSON: ` +
        `{"wards": [{"number": "1", "name": "..."}, ...]}.`,
    );
    const arr = this.pickArray(content, 'wards');
    const out: WardResult[] = [];
    const seen = new Set<string>();
    for (const raw of arr) {
      if (!raw || typeof raw !== 'object') continue;
      const rec = raw as Record<string, unknown>;
      const number = String(rec.number ?? '').trim();
      let name = String(rec.name ?? '').trim();
      if (!number && !name) continue;
      const num = number || String(out.length + 1);
      if (seen.has(num)) continue;
      seen.add(num);
      if (!name) name = `Ward ${num}`;
      out.push({ number: num, name });
    }
    return out;
  }

  /**
   * One chat completion returning the raw message content ('' on any failure).
   * Aborts after OPENAI_TIMEOUT_MS (default 12s) so a slow call never outlives
   * the mobile client's 15s request timeout — on abort we just return '' and
   * the caller falls back to whatever is already saved (or manual entry).
   */
  private async chat(system: string, user: string): Promise<string> {
    if (!this.apiKey) return '';
    const controller = new AbortController();
    const ms = Number(process.env.OPENAI_TIMEOUT_MS || 12000);
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.warn(`OpenAI returned ${res.status}`);
        return '';
      }
      const json: any = await res.json();
      return (json?.choices?.[0]?.message?.content as string) ?? '';
    } catch (e) {
      this.logger.warn(`OpenAI request failed: ${(e as Error).message}`);
      return '';
    } finally {
      clearTimeout(timer);
    }
  }

  /** Parse a JSON object and return the array at `key` (with fallbacks). */
  private pickArray(content: string, key: string): unknown[] {
    if (!content) return [];
    try {
      const obj = JSON.parse(content);
      if (Array.isArray(obj)) return obj;
      if (obj && typeof obj === 'object') {
        if (Array.isArray((obj as Record<string, unknown>)[key])) {
          return (obj as Record<string, unknown>)[key] as unknown[];
        }
        // Fallback: first array-valued property.
        for (const v of Object.values(obj as Record<string, unknown>)) {
          if (Array.isArray(v)) return v;
        }
      }
    } catch {
      /* ignore malformed JSON */
    }
    return [];
  }
}
