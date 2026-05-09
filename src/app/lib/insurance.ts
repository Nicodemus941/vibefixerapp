// Insurance pre-check answers — state law + coverage type → expected cost.
//
// Sources for the FL rule:
//   FL Statute 627.7288 (since 1992) prohibits insurers from applying a
//   deductible to comprehensive auto-glass repair/replacement on private
//   passenger vehicles in Florida. So FL + comprehensive = $0 to the customer.
//
// We deliberately keep this tool simple — two inputs, plain-English output,
// always with a "we'll confirm in 60 seconds" fallback to avoid overpromising
// on edge cases.

export type Coverage = "comprehensive" | "unknown" | "liability-only";

// "FL" gets special handling. Other states fall through to standard
// "deductible applies" copy. Add specific overrides here if you learn another
// state has a similar mandatory zero-deductible rule (e.g. KY, SC for repair).
export const STATES: { code: string; label: string }[] = [
  { code: "FL", label: "Florida" },
  { code: "GA", label: "Georgia" },
  { code: "AL", label: "Alabama" },
  { code: "TN", label: "Tennessee" },
  { code: "NC", label: "North Carolina" },
  { code: "SC", label: "South Carolina" },
  { code: "OTHER", label: "Other / not sure" },
];

export const COVERAGE_OPTIONS: { value: Coverage; label: string; sub: string }[] = [
  {
    value: "comprehensive",
    label: "Yes — comprehensive",
    sub: "covers glass, theft, weather",
  },
  {
    value: "unknown",
    label: "Not sure",
    sub: "we can check for you",
  },
  {
    value: "liability-only",
    label: "Liability only",
    sub: "covers other drivers, not glass",
  },
];

export type Verdict =
  | "free-with-insurance"  // FL + comprehensive: $0 out of pocket
  | "deductible-likely"    // Non-FL + comprehensive: deductible applies
  | "we-check"             // Don't know: call us, we verify in 60s
  | "cash-only";           // No comprehensive: cash quote path

export type AnswerCopy = {
  verdict: Verdict;
  headline: string;
  body: string;
  highlight: string;        // big number/phrase to surface
  cta: { primary: { label: string; href: string }; secondary?: { label: string; href: string } };
};

import { BUSINESS } from "../config";

export function answerFor(stateCode: string, coverage: Coverage): AnswerCopy {
  const isFL = stateCode === "FL";
  const callHref = `tel:${BUSINESS.phoneDial}`;
  const callLabel = `Call Eric · ${BUSINESS.phoneDisplay}`;

  if (coverage === "comprehensive" && isFL) {
    return {
      verdict: "free-with-insurance",
      highlight: "$0 out-of-pocket",
      headline: "You're covered. No deductible.",
      body:
        "Florida law (Statute 627.7288) requires comprehensive auto policies to cover " +
        "windshield repair and replacement with NO deductible. We file the claim with your " +
        "carrier directly — you don't pay a cent.",
      cta: {
        primary: { label: "Book a slot →", href: "/book" },
        secondary: { label: callLabel, href: callHref },
      },
    };
  }

  if (coverage === "comprehensive" && !isFL) {
    return {
      verdict: "deductible-likely",
      highlight: "Usually $250 – $500 deductible",
      headline: "Likely covered minus your deductible.",
      body:
        "Comprehensive coverage typically pays for windshield work after your deductible " +
        "(commonly $250–$500). We'll work with your carrier directly to file the claim. " +
        "Tell us your insurer when you call and we'll confirm exactly.",
      cta: {
        primary: { label: callLabel, href: callHref },
        secondary: { label: "Get a free quote →", href: "/quote" },
      },
    };
  }

  if (coverage === "unknown") {
    return {
      verdict: "we-check",
      highlight: "We'll verify in 60 seconds",
      headline: "Not sure? We'll check for you.",
      body:
        isFL
          ? "If you have comprehensive coverage in Florida, your repair or replacement is " +
            "$0 out-of-pocket — no deductible. Tell us your carrier and we'll confirm it on " +
            "the spot."
          : "Most comprehensive policies cover glass after your deductible. Tell us your " +
            "carrier when you call and we'll confirm what your plan does.",
      cta: {
        primary: { label: callLabel, href: callHref },
        secondary: { label: "Book a slot →", href: "/book" },
      },
    };
  }

  // liability-only
  return {
    verdict: "cash-only",
    highlight: "Honest cash quotes — no markup",
    headline: "No comp? No problem — cash quote it is.",
    body:
      "Liability-only policies don't cover glass damage, but our cash prices are fair, " +
      "transparent, and usually well below dealer rates. Use the cash calculator above " +
      "for an instant range, or call for a final-confirmed price.",
    cta: {
      primary: { label: "See cash price →", href: "#price" },
      secondary: { label: callLabel, href: callHref },
    },
  };
}
