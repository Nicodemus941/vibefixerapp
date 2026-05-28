// Canonical industry list. Keep this stable — changing labels would
// invalidate stored profile values + downstream matching keys.
//
// The matcher uses `industry` as a hard filter (or strong signal) in
// addition to embedding similarity, so consistent values across the
// userbase materially improve recall.
export const INDUSTRIES = [
  "SaaS",
  "AI / ML",
  "Fintech",
  "Healthtech",
  "Edtech",
  "E-commerce",
  "Marketplace",
  "Consumer / DTC",
  "Media / Content",
  "Creator economy",
  "Marketing / Growth",
  "Sales / RevOps",
  "Design / UX",
  "DevTools",
  "Cybersecurity",
  "Data / Analytics",
  "Web3 / Crypto",
  "Climate / Energy",
  "Biotech",
  "Hardware / IoT",
  "Robotics",
  "Real estate / Proptech",
  "Logistics / Supply chain",
  "Manufacturing",
  "Construction",
  "Legal / Regtech",
  "HR / Recruiting",
  "Professional services",
  "Coaching / Consulting",
  "Agency",
  "Non-profit",
  "Education",
  "Government / Civictech",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export function isKnownIndustry(value: string): value is Industry {
  return (INDUSTRIES as readonly string[]).includes(value);
}
