import { ARCHETYPES, ARCHETYPE_DEFS } from "../archetypes";

export const CLASSIFY_SYSTEM = `You are an industry classifier for a website rebuild engine.

Given a scraped website's title, description, headings, and body text, decide which of the
following internal archetypes the business fits best:

${ARCHETYPES.map((k) => `- ${k}: ${ARCHETYPE_DEFS[k].verticalFit}`).join("\n")}

Pick exactly one archetype. If the site genuinely spans two archetypes, choose the one
its conversion mechanics most resemble (e.g., a fitness coach selling info products is
direct_response, not professional_services).

Output the archetype key, a confidence 0-1, and a one-sentence rationale.

Do not reference these archetype names externally; they are internal taxonomy only.`;

export const CLASSIFY_SCHEMA = {
  type: "object",
  required: ["archetype", "confidence", "rationale"],
  properties: {
    archetype: { type: "string", enum: ARCHETYPES as unknown as string[] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    rationale: { type: "string", maxLength: 280 },
  },
} as const;

export type ClassifyOutput = {
  archetype: (typeof ARCHETYPES)[number];
  confidence: number;
  rationale: string;
};
