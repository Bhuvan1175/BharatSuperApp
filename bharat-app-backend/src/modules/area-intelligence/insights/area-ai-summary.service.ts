import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AreaInsightContext, AreaInsightResult } from './area-ai-summary.types';

/** Bump whenever the prompt shape/wording changes materially. */
const PROMPT_VERSION = '1.0.0';

/** Human label per AreaScoreCategory, for the no-OpenAI-key fallback summary. */
const CATEGORY_LABELS: Record<string, string> = {
  SAFETY: 'safety',
  TRAFFIC: 'traffic',
  HEALTHCARE: 'healthcare',
  SCHOOL: 'schools',
  INTERNET: 'internet',
  UTILITIES: 'utilities',
};

/**
 * AI Summary generator — same fetch()-to-OpenAI pattern as
 * LocationService.suggestNames (src/location/location.service.ts), not the
 * OpenAI SDK. Downstream of the numeric scores (docs §5): takes the already-
 * computed {overallScore, categoryScores, topStats, nearbyHighlights} as
 * context and asks for a JSON-mode {summary, pros[], cons[], recommendations[]}
 * response. Never a second source of truth for the scores themselves.
 */
@Injectable()
export class AreaAiSummaryService {
  private readonly logger = new Logger(AreaAiSummaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Builds context from persisted scores/stats/nearby and asks the LLM —
   * or, when no OPENAI_API_KEY is configured, composes a rule-based summary
   * from that same real data instead of leaving citizens with a placeholder.
   * Returns which path was used so the caller can record it accurately.
   */
  async generateForArea(
    areaId: string,
  ): Promise<{ result: AreaInsightResult; usedModel: boolean }> {
    const area = await this.prisma.areaMaster.findUnique({
      where: { id: areaId },
      include: {
        locality: { include: { city: true } },
        scoreSnapshot: true,
        categoryScores: true,
        statistics: { orderBy: { asOfDate: 'desc' }, take: 10 },
        nearbyAmenities: {
          orderBy: { distanceMeters: 'asc' },
          take: 5,
          include: { amenity: { select: { name: true, category: true } } },
        },
      },
    });
    if (!area) throw new NotFoundException('Area not found');

    const context: AreaInsightContext = {
      areaName: area.locality.name,
      cityName: area.locality.city.name,
      overallScore: area.scoreSnapshot?.overallScore ?? null,
      categoryScores: Object.fromEntries(
        area.categoryScores.map((c) => [c.category, c.score]),
      ),
      topStats: Object.fromEntries(
        area.statistics
          .filter((s) => s.value !== null)
          .map((s) => [s.statKey, s.value as number]),
      ),
      nearbyHighlights: area.nearbyAmenities.map(
        (n) =>
          `${n.amenity.name} (${n.amenity.category}, ${n.distanceMeters}m)`,
      ),
    };

    if (this.isConfigured()) {
      const modelResult = await this.callModel(context);
      if (modelResult) return { result: modelResult, usedModel: true };
    }
    return { result: this.buildFallbackSummary(context), usedModel: false };
  }

  /** Generates a fresh insight and persists it as the new current version,
   * marking any prior insight for the area as not-current (audit history kept). */
  async generateAndSave(areaId: string) {
    const { result, usedModel } = await this.generateForArea(areaId);

    const modelVersion = usedModel
      ? process.env.OPENAI_MODEL || 'gpt-4o-mini'
      : 'rule-based-fallback-1.0';
    const generatedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.areaInsight.updateMany({
        where: { areaId, isCurrent: true },
        data: { isCurrent: false },
      });
      return tx.areaInsight.create({
        data: {
          areaId,
          summary: result.summary,
          pros: result.pros,
          cons: result.cons,
          recommendations: result.recommendations,
          modelVersion,
          promptVersion: PROMPT_VERSION,
          generatedAt,
          isCurrent: true,
        },
      });
    });
  }

  /**
   * No-LLM fallback: composes a short, honest summary purely from the real
   * computed numbers/nearby data — same rule the LLM prompt itself follows
   * ("never invent facts not present in the input"), just without a model.
   */
  private buildFallbackSummary(context: AreaInsightContext): AreaInsightResult {
    const scored = Object.entries(context.categoryScores).filter(
      (entry): entry is [string, number] => entry[1] !== null,
    );
    const strengths = scored
      .filter(([, s]) => s >= 7)
      .map(([c]) => CATEGORY_LABELS[c] ?? c.toLowerCase());
    const weaknesses = scored
      .filter(([, s]) => s < 5)
      .map(([c]) => CATEGORY_LABELS[c] ?? c.toLowerCase());

    const scoreClause =
      context.overallScore != null
        ? `scores ${context.overallScore.toFixed(1)}/10 overall`
        : 'has not been fully scored yet';

    const summaryParts = [`${context.areaName}, ${context.cityName} ${scoreClause}.`];
    if (strengths.length) {
      summaryParts.push(`It performs well on ${this.joinList(strengths)}.`);
    }
    if (weaknesses.length) {
      summaryParts.push(
        `${this.capitalize(this.joinList(weaknesses))} ${
          weaknesses.length > 1 ? 'are' : 'is'
        } weaker here.`,
      );
    }
    if (context.nearbyHighlights.length) {
      summaryParts.push(
        `Nearby: ${context.nearbyHighlights.slice(0, 3).join(', ')}.`,
      );
    }
    if (!scored.length && !context.nearbyHighlights.length) {
      summaryParts.push(
        'More data will appear here as it gets synced for this area.',
      );
    }

    return {
      summary: summaryParts.join(' '),
      pros: strengths.map((s) => `Strong ${s}`),
      cons: weaknesses.map((s) => `Weaker ${s}`),
      recommendations: weaknesses.length
        ? [`Verify ${this.joinList(weaknesses)} on the ground before deciding.`]
        : [],
    };
  }

  private joinList(items: string[]): string {
    if (items.length <= 1) return items[0] ?? '';
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private async callModel(
    context: AreaInsightContext,
  ): Promise<AreaInsightResult | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You write short, factual real-estate area summaries for Indian localities, grounded ONLY in the ' +
                'structured data given to you. Never invent scores or facts not present in the input. Respond ONLY ' +
                'with a compact JSON object: {"summary": string, "pros": string[], "cons": string[], "recommendations": string[]}.',
            },
            {
              role: 'user',
              content: JSON.stringify(context),
            },
          ],
        }),
      });

      if (!res.ok) {
        this.logger.warn(`OpenAI returned ${res.status}`);
        return null;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content ?? '';
      return this.parseResult(content);
    } catch (e) {
      this.logger.warn(`OpenAI request failed: ${(e as Error).message}`);
      return null;
    }
  }

  private parseResult(content: string): AreaInsightResult | null {
    try {
      const parsed = JSON.parse(content) as {
        summary?: unknown;
        pros?: unknown;
        cons?: unknown;
        recommendations?: unknown;
      };
      if (typeof parsed.summary !== 'string') return null;
      const strings = (value: unknown): string[] =>
        Array.isArray(value)
          ? value.filter((v): v is string => typeof v === 'string')
          : [];
      return {
        summary: parsed.summary,
        pros: strings(parsed.pros),
        cons: strings(parsed.cons),
        recommendations: strings(parsed.recommendations),
      };
    } catch {
      return null;
    }
  }
}
