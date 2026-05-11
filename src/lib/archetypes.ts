export const ARCHETYPES = [
  "direct_response",
  "b2b_saas",
  "ecommerce_dtc",
  "professional_services",
  "medical_wellness",
  "hospitality",
  "luxury",
  "real_estate",
  "nonprofit",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];

type ArchetypeDef = {
  key: Archetype;
  label: string;
  verticalFit: string;
  styleCues: string;
  internalNotes: string;
};

export const ARCHETYPE_DEFS: Record<Archetype, ArchetypeDef> = {
  direct_response: {
    key: "direct_response",
    label: "Direct Response",
    verticalFit: "Coaches, agencies, fitness, info products, home services, local biz",
    styleCues: "Value stacks, guarantees, bonus stacks, urgency, high-contrast CTAs",
    internalNotes: "Apply $100M Offers principles internally: stacked value, risk reversal, scarcity.",
  },
  b2b_saas: {
    key: "b2b_saas",
    label: "B2B SaaS",
    verticalFit: "Software, dev tools, platforms",
    styleCues: "Clarity, social proof, ICP-specific copy, restrained typography (Linear/Vercel aesthetic)",
    internalNotes: "Apply Linear/Vercel design language internally: monochrome base, accent gradient, careful type scale.",
  },
  ecommerce_dtc: {
    key: "ecommerce_dtc",
    label: "Ecommerce / DTC",
    verticalFit: "Product brands, retail",
    styleCues: "Product-led, reviews, UGC, lifestyle imagery, trust signals",
    internalNotes: "Lead with product hero, badge stack, reviews above the fold.",
  },
  professional_services: {
    key: "professional_services",
    label: "Professional Services",
    verticalFit: "Law, finance, accounting, consulting",
    styleCues: "Authority, credentials, case studies, calm/serious tone",
    internalNotes: "Conservative palette, serif accents, credential bar.",
  },
  medical_wellness: {
    key: "medical_wellness",
    label: "Medical / Wellness",
    verticalFit: "Clinics, dental, mental health",
    styleCues: "Trust, credentials, gentle CTAs, compliance-aware copy",
    internalNotes: "Compliance-aware: avoid outcome guarantees. Soft palette.",
  },
  hospitality: {
    key: "hospitality",
    label: "Hospitality",
    verticalFit: "Restaurants, hotels, venues",
    styleCues: "Story-driven, sensory, atmosphere, location-first",
    internalNotes: "Atmospheric imagery, reservation CTA prominence.",
  },
  luxury: {
    key: "luxury",
    label: "Luxury",
    verticalFit: "High-end retail, lifestyle",
    styleCues: "Restraint, whitespace, scarcity through silence",
    internalNotes: "Sparse layout, editorial typography, restrained motion.",
  },
  real_estate: {
    key: "real_estate",
    label: "Real Estate",
    verticalFit: "Agents, brokerages",
    styleCues: "Lifestyle, aspirational photography, neighborhood-first",
    internalNotes: "Map-driven, neighborhood badges, lead capture in hero.",
  },
  nonprofit: {
    key: "nonprofit",
    label: "Nonprofit",
    verticalFit: "Charities, NGOs",
    styleCues: "Impact metrics, transparency, story arcs",
    internalNotes: "Big impact number, transparency report link, donate CTA in nav.",
  },
};

export function isArchetype(s: string): s is Archetype {
  return (ARCHETYPES as readonly string[]).includes(s);
}
