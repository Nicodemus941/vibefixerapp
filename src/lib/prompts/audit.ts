import { RUBRIC_CATEGORIES, CATEGORY_LABELS } from "../rubric";
import { ARCHETYPE_DEFS, type Archetype } from "../archetypes";

export const AUDIT_SCHEMA = {
  type: "object",
  required: ["scores", "findings", "recommendations"],
  properties: {
    scores: {
      type: "object",
      required: RUBRIC_CATEGORIES as unknown as string[],
      properties: Object.fromEntries(
        RUBRIC_CATEGORIES.map((c) => [c, { type: "integer", minimum: 1, maximum: 10 }]),
      ),
    },
    findings: {
      type: "object",
      required: RUBRIC_CATEGORIES as unknown as string[],
      properties: Object.fromEntries(
        RUBRIC_CATEGORIES.map((c) => [
          c,
          {
            type: "object",
            required: ["score", "working", "missing", "recommendation"],
            properties: {
              score: { type: "integer", minimum: 1, maximum: 10 },
              working: { type: "string", maxLength: 400 },
              missing: { type: "string", maxLength: 400 },
              recommendation: { type: "string", maxLength: 400 },
            },
          },
        ]),
      ),
    },
    recommendations: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: {
        type: "object",
        required: ["category", "priority", "action", "rationale"],
        properties: {
          category: { type: "string", enum: RUBRIC_CATEGORIES as unknown as string[] },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          action: { type: "string", maxLength: 200 },
          rationale: { type: "string", maxLength: 280 },
        },
      },
    },
  },
} as const;

export function buildAuditSystem(archetype: Archetype): string {
  const def = ARCHETYPE_DEFS[archetype];
  const rubric = RUBRIC_CATEGORIES.map(
    (c) => `- ${c} (${CATEGORY_LABELS[c]}): score 1-10. What's working / what's missing / one specific recommendation.`,
  ).join("\n");

  return `You are a UI/UX conversion auditor for our rebuild engine.

Audit the supplied website against the rubric below, calibrated for the ${def.label} archetype.

ARCHETYPE PROFILE (internal-only):
- Vertical fit: ${def.verticalFit}
- Style cues: ${def.styleCues}
- Internal notes: ${def.internalNotes}

RUBRIC (score each 1-10):
${rubric}

Scoring guide:
- 1-3: Major gaps; would lose most visitors at this category.
- 4-6: Average; recognizable patterns but not converting hard.
- 7-8: Strong; the page does this well.
- 9-10: Best-in-class; nothing to change.

Rules:
- Be specific. Reference actual headlines, CTAs, sections, or missing elements from the scrape.
- Recommendations must be concrete, single-action, and implementable in a rebuild.
- Do not mention AI, LLMs, Claude, or "our model" anywhere. Frame as "our rebuild engine" if needed.
- Do not mention the archetype name to the end user.
- Return between 3 and 8 prioritized recommendations across categories, ordered by impact.`;
}

export function buildAuditUser(scrape: {
  copy: { title: string; description: string; headings: string[]; bodyText: string };
  colors: string[];
  fonts: string[];
  structure: { hasHero: boolean; hasNav: boolean; sectionCount: number; ctaCount: number };
}): string {
  return [
    `URL TITLE: ${scrape.copy.title}`,
    `META DESCRIPTION: ${scrape.copy.description}`,
    `HEADINGS:\n${scrape.copy.headings.slice(0, 25).map((h) => `- ${h}`).join("\n")}`,
    `STRUCTURE: hero=${scrape.structure.hasHero} nav=${scrape.structure.hasNav} sections=${scrape.structure.sectionCount} ctas=${scrape.structure.ctaCount}`,
    `COLORS (sample): ${scrape.colors.slice(0, 8).join(", ")}`,
    `FONTS (sample): ${scrape.fonts.slice(0, 4).join(", ")}`,
    `BODY EXCERPT:\n${scrape.copy.bodyText.slice(0, 4000)}`,
  ].join("\n\n");
}
