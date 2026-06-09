import type { Client, Goal } from "./data";

// ── AI Credit Analysis (simulated model output) ─────────────────────────────
export function buildAnalysis(c: Client) {
  const mid = Math.round((c.scoreHistory.at(-1)!.experian + c.scoreHistory.at(-1)!.equifax + c.scoreHistory.at(-1)!.transunion) / 3);
  const negCount = c.negatives.filter((n) => n.status !== "Deleted").length;
  const collections = c.negatives.filter((n) => n.type === "Collection").length;
  const lates = c.negatives.filter((n) => n.type === "Late Payment").length;
  const inquiries = c.negatives.filter((n) => n.type === "Inquiry").length;
  return {
    headline: `${c.name} — Current mid-score ${mid}. ${negCount} active derogatory item${negCount === 1 ? "" : "s"} identified across the three bureaus.`,
    summary: `Based on a full tri-merge review, ${c.name.split(" ")[0]}'s profile shows ${negCount} negative item${negCount === 1 ? "" : "s"} suppressing the score. The fastest path to the ${c.goal} goal is to remove the unverifiable collections first, then strengthen the file with on-time history and low utilization. With our atomic dispute approach, a realistic 60–120 day lift of 40–90 points is on the table.`,
    factors: [
      { label: "Payment History (35%)", grade: lates > 0 ? "Needs Work" : "Good", note: lates > 0 ? `${lates} late payment(s) reporting — goodwill + dispute candidates.` : "No recent lates. Keep it perfect." },
      { label: "Credit Utilization (30%)", grade: "Watch", note: "Keep revolving balances under 10% before the goal application." },
      { label: "Derogatory Marks", grade: collections > 0 ? "Critical" : "Good", note: collections > 0 ? `${collections} collection(s) — primary dispute targets.` : "Clean of collections." },
      { label: "Credit Age & Mix", grade: "Fair", note: "Add 1–2 quality tradelines to thicken the file." },
      { label: "Hard Inquiries", grade: inquiries > 0 ? "Watch" : "Good", note: inquiries > 0 ? `${inquiries} questionable inquiry(ies) to challenge.` : "No problem inquiries." },
    ],
    recommendations: [
      "Round 1: dispute all unverifiable collections via FCRA §611 + debt validation.",
      "Submit goodwill / Metro 2 challenges on late payments.",
      "Open/optimize 1 secured or starter tradeline; keep utilization <10%.",
      `Hold all new applications until mid-score clears ${c.targetScore}.`,
      "Re-pull in 35 days to verify bureau responses and re-strategize.",
    ],
    projection: { d30: mid + 18, d60: mid + 41, d90: Math.min(mid + 72, c.targetScore + 8) },
  };
}

// ── Goal-based 6–12 month game plan ─────────────────────────────────────────
const goalMeta: Record<Goal, { score: number; months: number; tagline: string; extra: string[] }> = {
  Home: {
    score: 640,
    months: 9,
    tagline: "FHA-ready in 9 months — own the keys, not the rent receipt.",
    extra: ["Reach 640+ mid-score (FHA) / 680+ (conventional)", "Build 12 months clean payment history", "Lower utilization below 10% before pre-approval", "Save 3.5% down + reserves", "Avoid ALL new debt 6 months before closing"],
  },
  Car: {
    score: 660,
    months: 6,
    tagline: "Drive off in 6 months with a sub-10% APR — no buy-here-pay-here.",
    extra: ["Reach 660+ for prime auto rates", "Remove auto-related collections/lates", "Add a tradeline to show installment history", "Get pre-qualified before stepping on the lot"],
  },
  Apartment: {
    score: 620,
    months: 4,
    tagline: "Approved with no co-signer in 4 months.",
    extra: ["Reach 620+ and clear evictions/rental collections", "Remove public records", "Generate rental-readiness letter", "Build 2 positive tradelines"],
  },
  "Start Business": {
    score: 680,
    months: 8,
    tagline: "Launch on a foundation lenders respect — in 8 months.",
    extra: ["Personal score to 680+", "Form LLC + EIN, open business bank account", "Establish D-U-N-S number", "Open 3 net-30 vendor accounts", "Separate personal & business credit"],
  },
  "Business Funding": {
    score: 700,
    months: 10,
    tagline: "Funding-ready for $50k+ in 10 months.",
    extra: ["Personal score to 700+ with <10% utilization", "Build business credit profile (Dun & Bradstreet, Experian Biz)", "Stack 5 net-30 vendors → store cards → fleet cards", "12 months business bank seasoning", "Prepare funding package & lender list"],
  },
};

export function buildGamePlan(c: Client, goal: Goal) {
  const meta = goalMeta[goal];
  const phases = [
    { window: "Month 1", title: "Foundation & Cleanup", items: ["Full tri-merge pull + AI analysis", "Launch Round 1 atomic disputes", "Set up credit monitoring + portal", "Lock in budget & autopay on all accounts"] },
    { window: "Months 2–3", title: "Aggressive Disputing", items: ["Round 2 disputes (MOV + estoppel)", "Goodwill letters on late payments", "Drop revolving utilization under 10%", "Add first optimized tradeline"] },
    { window: "Months 4–6", title: "Rebuild & Strengthen", items: ["Verify deletions, re-strategize stragglers", `Push mid-score toward ${meta.score}`, "Add 2nd tradeline / authorized user", "Begin goal-specific prep (below)"] },
    { window: `Months 7–${meta.months}`, title: "Goal Execution", items: meta.extra },
  ];
  return { meta, phases, goal };
}

// ── Atomic dispute letter generator ─────────────────────────────────────────
export function buildDisputeLetter(opts: {
  client: Client;
  bureau: string;
  items: { creditor: string; reason: string }[];
  strategy: string;
}) {
  const { client, bureau, items, strategy } = opts;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const bureauAddr: Record<string, string> = {
    Experian: "Experian\nP.O. Box 4500\nAllen, TX 75013",
    Equifax: "Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374",
    TransUnion: "TransUnion Consumer Solutions\nP.O. Box 2000\nChester, PA 19016",
  };
  const itemBlock = items
    .map(
      (it, i) =>
        `   ${i + 1}. Account: ${it.creditor}\n      Basis for dispute: ${it.reason}\n      Demand: Delete or correct — provide certifiable proof of accuracy.`
    )
    .join("\n\n");

  return `${today}

${client.name}
${client.city}
RE: Formal Dispute of Inaccurate Information

${bureauAddr[bureau] || bureau}

To Whom It May Concern:

I am writing to formally dispute the following item(s) appearing on my credit
report. After reviewing my file, the information below is inaccurate, incomplete,
or cannot be verified, and I am exercising my rights under the Fair Credit
Reporting Act (FCRA).

Strategy applied: ${strategy}

Disputed item(s):

${itemBlock}

Under FCRA §611 (15 U.S.C. §1681i), you are required to conduct a reasonable
reinvestigation of the disputed item(s) within 30 days. I am specifically
demanding the METHOD OF VERIFICATION, including the name, address, and telephone
number of any furnisher contacted, and the documentation relied upon. A response
of "verified" without producing these records does not satisfy your obligations.

Should you be unable to provide verifiable proof that this information is 100%
accurate and reporting in full compliance with Metro 2 standards, you must
promptly DELETE the item(s) and send me an updated copy of my credit report.

This letter was generated by JV Credit Repair Services on behalf of the consumer
named above, who has authorized this dispute. Please direct all correspondence
to the address on file.

Respectfully,


${client.name}

Enclosures: Copy of government-issued ID, proof of address
"We Repair Credit. We Restore Lives." — JV Credit Repair Services`;
}
