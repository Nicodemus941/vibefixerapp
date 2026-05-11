export const RUBRIC_CATEGORIES = [
  "offerClarity",
  "ctaStrength",
  "socialProof",
  "trustSignals",
  "visualHierarchy",
  "mobileExperience",
  "pageSpeedCues",
  "conversionFriction",
  "copyQuality",
  "brandConsistency",
] as const;

export type RubricCategory = (typeof RUBRIC_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<RubricCategory, string> = {
  offerClarity: "Offer Clarity",
  ctaStrength: "CTA Strength",
  socialProof: "Social Proof",
  trustSignals: "Trust Signals",
  visualHierarchy: "Visual Hierarchy",
  mobileExperience: "Mobile Experience",
  pageSpeedCues: "Page Speed Cues",
  conversionFriction: "Conversion Friction",
  copyQuality: "Copy Quality",
  brandConsistency: "Brand Consistency",
};

// Weights sum to 1.0. Direct-response weights CTA + offer heavier; you can swap per archetype later.
export const DEFAULT_WEIGHTS: Record<RubricCategory, number> = {
  offerClarity: 0.15,
  ctaStrength: 0.13,
  socialProof: 0.1,
  trustSignals: 0.08,
  visualHierarchy: 0.1,
  mobileExperience: 0.1,
  pageSpeedCues: 0.07,
  conversionFriction: 0.1,
  copyQuality: 0.1,
  brandConsistency: 0.07,
};

export type CategoryFinding = {
  score: number; // 1-10
  working: string;
  missing: string;
  recommendation: string;
};

export type AuditResult = {
  scores: Record<RubricCategory, number>;
  overallScore: number; // 0-100
  findings: Record<RubricCategory, CategoryFinding>;
  recommendations: Array<{
    category: RubricCategory;
    priority: "high" | "medium" | "low";
    action: string;
    rationale: string;
  }>;
};

export function weightedOverall(scores: Record<RubricCategory, number>): number {
  let total = 0;
  for (const cat of RUBRIC_CATEGORIES) {
    total += (scores[cat] ?? 0) * DEFAULT_WEIGHTS[cat];
  }
  // Convert 1-10 weighted average to a 0-100 score.
  return Math.round(total * 10);
}
