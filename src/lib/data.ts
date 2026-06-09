// ─────────────────────────────────────────────────────────────────────────────
//  JV CREDIT REPAIR — demo data layer
//  All data here is mock/sample data used to demonstrate workflows.
// ─────────────────────────────────────────────────────────────────────────────

export type Goal = "Home" | "Car" | "Apartment" | "Start Business" | "Business Funding";
export type Stage =
  | "Lead"
  | "Onboarding"
  | "Analysis"
  | "Disputing"
  | "Rebuilding"
  | "Goal Ready"
  | "Graduated";
export type PaymentStatus = "Current" | "Past Due" | "Paid in Full" | "Trial";

export interface NegativeItem {
  id: string;
  creditor: string;
  type: "Collection" | "Charge-off" | "Late Payment" | "Inquiry" | "Public Record" | "Repossession";
  bureau: ("Experian" | "Equifax" | "TransUnion")[];
  balance: number;
  opened: string;
  status: "Negative" | "In Dispute" | "Deleted" | "Verified" | "Updated";
  reason: string;
}

export interface DisputeRound {
  round: number;
  sentDate: string;
  bureau: "Experian" | "Equifax" | "TransUnion" | "All Bureaus";
  strategy: string;
  items: number;
  status: "Drafted" | "Mailed" | "In Progress" | "Responded" | "Completed";
  result?: string;
  deletions?: number;
}

export interface Communication {
  id: string;
  channel: "SMS" | "Email";
  direction: "out" | "in";
  date: string;
  subject?: string;
  body: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  type: "Credit Report" | "ID" | "Proof of Address" | "Dispute Letter" | "Agreement" | "Result Letter";
  date: string;
  size: string;
}

export interface ClientNote {
  id: string;
  date: string;
  author: string;
  body: string;
}

export interface ScorePoint {
  month: string;
  experian: number;
  equifax: number;
  transunion: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  avatarColor: string;
  goal: Goal;
  stage: Stage;
  payment: PaymentStatus;
  plan: string;
  monthly: number;
  joined: string;
  nextAction: string;
  nextActionDate: string;
  startScore: number;
  currentScore: number;
  targetScore: number;
  monitoring: { provider: string; username: string; password: string };
  negatives: NegativeItem[];
  rounds: DisputeRound[];
  comms: Communication[];
  documents: ClientDocument[];
  notes: ClientNote[];
  scoreHistory: ScorePoint[];
}

const sh = (a: number, b: number, c: number, d: number, e: number): ScorePoint[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const base = [a, b, c, d, e, e + 12];
  return months.map((m, i) => ({
    month: m,
    experian: base[i],
    equifax: base[i] - 6,
    transunion: base[i] + 4,
  }));
};

export const clients: Client[] = [
  {
    id: "maria-santos",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    phone: "(689) 555-0142",
    city: "Orlando, FL",
    avatarColor: "#1f9dff",
    goal: "Home",
    stage: "Disputing",
    payment: "Current",
    plan: "Aggressive Repair",
    monthly: 149,
    joined: "2026-02-12",
    nextAction: "Mail Round 2 dispute letters (Equifax)",
    nextActionDate: "2026-06-11",
    startScore: 558,
    currentScore: 631,
    targetScore: 680,
    monitoring: { provider: "IdentityIQ", username: "msantos_iiq", password: "••••••••" },
    negatives: [
      { id: "n1", creditor: "Midland Credit Mgmt", type: "Collection", bureau: ["Experian", "Equifax"], balance: 842, opened: "2023-04-10", status: "In Dispute", reason: "No signed contract / unverified debt" },
      { id: "n2", creditor: "Capital One", type: "Charge-off", bureau: ["TransUnion"], balance: 1240, opened: "2022-11-02", status: "Deleted", reason: "Re-aged account / inaccurate DOFD" },
      { id: "n3", creditor: "Portfolio Recovery", type: "Collection", bureau: ["Experian", "Equifax", "TransUnion"], balance: absInt(560), opened: "2023-01-19", status: "In Dispute", reason: "Failure to validate per FDCPA §809" },
      { id: "n4", creditor: "Credit One Bank", type: "Late Payment", bureau: ["Equifax"], balance: 0, opened: "2024-06-15", status: "Negative", reason: "Reported late during forbearance" },
      { id: "n5", creditor: "Comenity Bank", type: "Inquiry", bureau: ["Experian"], balance: 0, opened: "2025-09-01", status: "Negative", reason: "Unauthorized hard inquiry" },
    ],
    rounds: [
      { round: 1, sentDate: "2026-03-02", bureau: "All Bureaus", strategy: "FCRA §611 Reinvestigation + Metro 2 compliance challenge", items: 5, status: "Completed", result: "2 deletions, 1 updated", deletions: 2 },
      { round: 2, sentDate: "2026-06-11", bureau: "Equifax", strategy: "Method of Verification (MOV) demand + FDCPA §809 validation", items: 3, status: "Drafted" },
    ],
    comms: [
      { id: "c1", channel: "SMS", direction: "out", date: "2026-06-08 09:12", body: "Hi Maria! Great news — Capital One charge-off was DELETED from TransUnion 🎉 Your score is climbing. Round 2 letters go out this week." },
      { id: "c2", channel: "SMS", direction: "in", date: "2026-06-08 09:31", body: "That's amazing!! Thank you Jonathan 🙏 Are we still on track for the house by fall?" },
      { id: "c3", channel: "Email", direction: "out", date: "2026-06-08 09:40", subject: "Your June Credit Update + Home Game Plan", body: "Maria, attached is your updated analysis. You're now at 631 (+73 since February). Stay tuned for Round 2." },
    ],
    documents: [
      { id: "d1", name: "Maria_3B_Report_Feb2026.pdf", type: "Credit Report", date: "2026-02-12", size: "1.8 MB" },
      { id: "d2", name: "Round1_DisputePacket.pdf", type: "Dispute Letter", date: "2026-03-02", size: "640 KB" },
      { id: "d3", name: "TU_Deletion_Result.pdf", type: "Result Letter", date: "2026-05-29", size: "210 KB" },
      { id: "d4", name: "DriversLicense.jpg", type: "ID", date: "2026-02-12", size: "820 KB" },
    ],
    notes: [
      { id: "no1", date: "2026-02-12", author: "Jonathan V.", body: "Goal: FHA loan in 6 months. Needs mid-score of 640+. Strong income, just credit cleanup + 1 new tradeline." },
      { id: "no2", date: "2026-05-29", author: "Jonathan V.", body: "TU deletion confirmed. Added secured card recommendation for thickness." },
    ],
    scoreHistory: sh(558, 571, 588, 604, 619, 631),
  },
  {
    id: "darnell-w",
    name: "Darnell Washington",
    email: "d.washington@email.com",
    phone: "(689) 555-0177",
    city: "Tampa, FL",
    avatarColor: "#e8b73e",
    goal: "Business Funding",
    stage: "Rebuilding",
    payment: "Current",
    plan: "Business Builder",
    monthly: 199,
    joined: "2025-12-03",
    nextAction: "Add 2nd net-30 vendor tradeline",
    nextActionDate: "2026-06-14",
    startScore: 602,
    currentScore: 694,
    targetScore: 720,
    monitoring: { provider: "MyScoreIQ", username: "dwash_biz", password: "••••••••" },
    negatives: [
      { id: "n1", creditor: "LVNV Funding", type: "Collection", bureau: ["Experian", "Equifax", "TransUnion"], balance: 1890, opened: "2022-08-12", status: "Deleted", reason: "Unverified — no chain of assignment" },
      { id: "n2", creditor: "Synchrony Bank", type: "Charge-off", bureau: ["Experian"], balance: 2210, opened: "2023-02-20", status: "Verified", reason: "Goodwill + pay-for-delete in progress" },
      { id: "n3", creditor: "T-Mobile", type: "Collection", bureau: ["Equifax"], balance: 410, opened: "2024-01-08", status: "Deleted", reason: "Validation failure" },
    ],
    rounds: [
      { round: 1, sentDate: "2025-12-20", bureau: "All Bureaus", strategy: "Debt validation + FCRA §623 furnisher dispute", items: 4, status: "Completed", result: "2 deletions", deletions: 2 },
      { round: 2, sentDate: "2026-02-14", bureau: "Experian", strategy: "Estoppel by silence + MOV demand", items: 2, status: "Completed", result: "1 deletion", deletions: 1 },
      { round: 3, sentDate: "2026-04-30", bureau: "Experian", strategy: "Pay-for-delete negotiation (Synchrony)", items: 1, status: "In Progress" },
    ],
    comms: [
      { id: "c1", channel: "Email", direction: "out", date: "2026-06-05 14:02", subject: "Business Funding Readiness — You're close!", body: "Darnell, your personal scores are funding-ready. Next we build business credit: EIN, D-U-N-S, and 3 net-30 vendors. Plan attached." },
      { id: "c2", channel: "SMS", direction: "in", date: "2026-06-05 16:20", body: "Let's go 🔥 I already opened the business bank account like you said." },
    ],
    documents: [
      { id: "d1", name: "Darnell_3B_Dec2025.pdf", type: "Credit Report", date: "2025-12-03", size: "2.0 MB" },
      { id: "d2", name: "Business_Credit_Roadmap.pdf", type: "Agreement", date: "2026-06-05", size: "480 KB" },
    ],
    notes: [
      { id: "no1", date: "2025-12-03", author: "Jonathan V.", body: "Wants $50k in business funding within 9 months. Personal credit first, then biz credit stack." },
    ],
    scoreHistory: sh(602, 628, 651, 668, 682, 694),
  },
  {
    id: "ashley-kim",
    name: "Ashley Kim",
    email: "ashley.kim@email.com",
    phone: "(689) 555-0190",
    city: "Kissimmee, FL",
    avatarColor: "#34d399",
    goal: "Car",
    stage: "Analysis",
    payment: "Trial",
    plan: "Starter Repair",
    monthly: 99,
    joined: "2026-06-01",
    nextAction: "Send onboarding + run AI analysis",
    nextActionDate: "2026-06-10",
    startScore: 591,
    currentScore: 591,
    targetScore: 660,
    monitoring: { provider: "IdentityIQ", username: "akim_iiq", password: "••••••••" },
    negatives: [
      { id: "n1", creditor: "Americollect", type: "Collection", bureau: ["Equifax", "TransUnion"], balance: 320, opened: "2024-09-10", status: "Negative", reason: "Medical collection — under $500, HIPAA challenge" },
      { id: "n2", creditor: "Wells Fargo Auto", type: "Late Payment", bureau: ["Experian", "Equifax", "TransUnion"], balance: 0, opened: "2024-03-12", status: "Negative", reason: "30-day late x2, goodwill candidate" },
      { id: "n3", creditor: "SoFi", type: "Inquiry", bureau: ["TransUnion"], balance: 0, opened: "2026-05-22", status: "Negative", reason: "Unrecognized inquiry" },
    ],
    rounds: [],
    comms: [
      { id: "c1", channel: "SMS", direction: "out", date: "2026-06-02 10:00", body: "Welcome to JV Credit Repair, Ashley! Upload your credit report PDF in your portal and I'll run your free AI analysis today." },
    ],
    documents: [{ id: "d1", name: "Ashley_Report_June2026.pdf", type: "Credit Report", date: "2026-06-01", size: "1.6 MB" }],
    notes: [{ id: "no1", date: "2026-06-01", author: "Jonathan V.", body: "Needs reliable car for new job. Targeting sub-10% APR auto loan — get her to 660+." }],
    scoreHistory: [
      { month: "Jan", experian: 0, equifax: 0, transunion: 0 },
      { month: "Feb", experian: 0, equifax: 0, transunion: 0 },
      { month: "Mar", experian: 0, equifax: 0, transunion: 0 },
      { month: "Apr", experian: 0, equifax: 0, transunion: 0 },
      { month: "May", experian: 0, equifax: 0, transunion: 0 },
      { month: "Jun", experian: 591, equifax: 585, transunion: 595 },
    ],
  },
  {
    id: "robert-lee",
    name: "Robert Lee",
    email: "rob.lee@email.com",
    phone: "(689) 555-0203",
    city: "Lakeland, FL",
    avatarColor: "#a78bfa",
    goal: "Apartment",
    stage: "Goal Ready",
    payment: "Paid in Full",
    plan: "Starter Repair",
    monthly: 99,
    joined: "2026-01-08",
    nextAction: "Issue rental-readiness letter + graduate",
    nextActionDate: "2026-06-12",
    startScore: 540,
    currentScore: 648,
    targetScore: 620,
    monitoring: { provider: "MyScoreIQ", username: "rlee_msq", password: "••••••••" },
    negatives: [
      { id: "n1", creditor: "Conn's HomePlus", type: "Charge-off", bureau: ["Experian", "Equifax"], balance: 980, opened: "2022-05-30", status: "Deleted", reason: "Inaccurate balance reporting" },
      { id: "n2", creditor: "Eviction Record", type: "Public Record", bureau: ["TransUnion"], balance: 0, opened: "2021-07-01", status: "Deleted", reason: "Removed via rental dispute process" },
      { id: "n3", creditor: "IC System", type: "Collection", bureau: ["Equifax"], balance: 210, opened: "2023-12-04", status: "Deleted", reason: "Pay-for-delete completed" },
    ],
    rounds: [
      { round: 1, sentDate: "2026-01-22", bureau: "All Bureaus", strategy: "FCRA §611 + Metro 2 balance challenge", items: 3, status: "Completed", result: "3 deletions", deletions: 3 },
    ],
    comms: [
      { id: "c1", channel: "SMS", direction: "out", date: "2026-06-01 11:00", body: "Robert you DID IT — 648 and all negatives gone. Sending your rental-readiness letter so you can get approved with no co-signer." },
      { id: "c2", channel: "SMS", direction: "in", date: "2026-06-01 11:14", body: "Man I can't thank you enough. This changed my life 🙏" },
    ],
    documents: [
      { id: "d1", name: "Robert_3B_Jan2026.pdf", type: "Credit Report", date: "2026-01-08", size: "1.7 MB" },
      { id: "d2", name: "Rental_Readiness_Letter.pdf", type: "Result Letter", date: "2026-06-01", size: "180 KB" },
    ],
    notes: [{ id: "no1", date: "2026-01-08", author: "Jonathan V.", body: "Past eviction is the blocker. Clear public record + 1 collection and he qualifies for most apartments." }],
    scoreHistory: sh(540, 561, 583, 606, 628, 648),
  },
  {
    id: "tasha-brooks",
    name: "Tasha Brooks",
    email: "tasha.b@email.com",
    phone: "(689) 555-0218",
    city: "Sanford, FL",
    avatarColor: "#f87171",
    goal: "Start Business",
    stage: "Lead",
    payment: "Trial",
    plan: "Consultation",
    monthly: 0,
    joined: "2026-06-07",
    nextAction: "Book discovery call + collect report",
    nextActionDate: "2026-06-09",
    startScore: 612,
    currentScore: 612,
    targetScore: 700,
    monitoring: { provider: "—", username: "—", password: "—" },
    negatives: [],
    rounds: [],
    comms: [
      { id: "c1", channel: "SMS", direction: "in", date: "2026-06-07 19:40", body: "Hi I saw your post on Facebook! I want to start my own salon business, can you help my credit?" },
      { id: "c2", channel: "SMS", direction: "out", date: "2026-06-07 19:52", body: "Absolutely Tasha! Faith-driven, results-focused — that's us. Let's book a free 15-min call. What time works tomorrow?" },
    ],
    documents: [],
    notes: [{ id: "no1", date: "2026-06-07", author: "Jonathan V.", body: "Inbound FB lead. Salon startup. Send intake link + consultation booking." }],
    scoreHistory: [
      { month: "Jan", experian: 0, equifax: 0, transunion: 0 },
      { month: "Feb", experian: 0, equifax: 0, transunion: 0 },
      { month: "Mar", experian: 0, equifax: 0, transunion: 0 },
      { month: "Apr", experian: 0, equifax: 0, transunion: 0 },
      { month: "May", experian: 0, equifax: 0, transunion: 0 },
      { month: "Jun", experian: 612, equifax: 608, transunion: 616 },
    ],
  },
];

function absInt(n: number) {
  return n;
}

export const getClient = (id: string) => clients.find((c) => c.id === id);

// ── Pipeline / KPI helpers ──────────────────────────────────────────────────
export const stages: Stage[] = ["Lead", "Onboarding", "Analysis", "Disputing", "Rebuilding", "Goal Ready", "Graduated"];

export const kpis = () => {
  const active = clients.filter((c) => c.stage !== "Lead" && c.stage !== "Graduated").length;
  const inDispute = clients.reduce((a, c) => a + c.negatives.filter((n) => n.status === "In Dispute").length, 0);
  const deletions = clients.reduce(
    (a, c) => a + c.rounds.reduce((b, r) => b + (r.deletions || 0), 0),
    0
  );
  const withScores = clients.filter((c) => c.currentScore > c.startScore);
  const avgLift = Math.round(
    withScores.reduce((a, c) => a + (c.currentScore - c.startScore), 0) / Math.max(1, withScores.length)
  );
  const mrr = clients.reduce((a, c) => a + c.monthly, 0);
  return { active, inDispute, deletions, avgLift, mrr, total: clients.length };
};

// ── Tasks / reminders ───────────────────────────────────────────────────────
export interface TaskItem {
  id: string;
  client: string;
  clientId: string;
  title: string;
  due: string;
  type: "Dispute" | "Follow-up" | "Reminder" | "Onboarding" | "Payment" | "Review";
  priority: "High" | "Medium" | "Low";
  done: boolean;
}

export const tasks: TaskItem[] = [
  { id: "t1", client: "Maria Santos", clientId: "maria-santos", title: "Mail Round 2 dispute letters (Equifax)", due: "2026-06-11", type: "Dispute", priority: "High", done: false },
  { id: "t2", client: "Ashley Kim", clientId: "ashley-kim", title: "Run AI credit analysis + email results", due: "2026-06-10", type: "Onboarding", priority: "High", done: false },
  { id: "t3", client: "Tasha Brooks", clientId: "tasha-brooks", title: "Discovery call — salon startup funding", due: "2026-06-09", type: "Follow-up", priority: "High", done: false },
  { id: "t4", client: "Darnell Washington", clientId: "darnell-w", title: "Add 2nd net-30 vendor tradeline", due: "2026-06-14", type: "Review", priority: "Medium", done: false },
  { id: "t5", client: "Robert Lee", clientId: "robert-lee", title: "Send rental-readiness letter + graduate", due: "2026-06-12", type: "Reminder", priority: "Medium", done: false },
  { id: "t6", client: "Maria Santos", clientId: "maria-santos", title: "30-day check-in: confirm bureau responses", due: "2026-06-30", type: "Reminder", priority: "Low", done: false },
  { id: "t7", client: "Darnell Washington", clientId: "darnell-w", title: "Follow up on Synchrony pay-for-delete", due: "2026-06-13", type: "Dispute", priority: "Medium", done: false },
  { id: "t8", client: "Ashley Kim", clientId: "ashley-kim", title: "Convert trial → Starter Repair plan", due: "2026-06-15", type: "Payment", priority: "Medium", done: false },
];

// ── Dispute strategy library (Jonathan's "atomic" strategies) ───────────────
export const disputeStrategies = [
  { id: "s1", name: "FCRA §611 Reinvestigation", desc: "Compel bureaus to verify with original creditor within 30 days or delete.", best: "Collections, charge-offs" },
  { id: "s2", name: "Metro 2 Compliance Challenge", desc: "Challenge data that violates Metro 2 reporting format (dates, balances, status codes).", best: "Inaccurate tradelines" },
  { id: "s3", name: "FDCPA §809 Debt Validation", desc: "Demand the collector prove the debt is yours with documentation.", best: "Third-party collections" },
  { id: "s4", name: "Method of Verification (MOV)", desc: "After a 'verified' result, demand HOW they verified — names, docs, procedures.", best: "Stubborn verified items" },
  { id: "s5", name: "Estoppel by Silence", desc: "Leverage non-response to a prior validation request as admission.", best: "Round 2+ collections" },
  { id: "s6", name: "FCRA §623 Furnisher Dispute", desc: "Dispute directly with the data furnisher, not just the bureau.", best: "Banks, lenders" },
  { id: "s7", name: "HIPAA Medical Challenge", desc: "Challenge medical collections that expose protected health info.", best: "Medical collections" },
  { id: "s8", name: "Pay-for-Delete Negotiation", desc: "Negotiate deletion in exchange for payment, in writing.", best: "Valid recent debts" },
  { id: "s9", name: "Re-aging / DOFD Challenge", desc: "Challenge accounts reporting past the 7-year window or re-aged dates.", best: "Old accounts" },
  { id: "s10", name: "Unauthorized Inquiry Removal", desc: "Remove hard inquiries made without permissible purpose.", best: "Hard inquiries" },
];

// ── Automations ─────────────────────────────────────────────────────────────
export interface Automation {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  status: "Active" | "Active" | "Draft";
  runs: number;
}

export const automations: Automation[] = [
  {
    id: "a1",
    name: "New Client Onboarding",
    trigger: "Client signs agreement",
    steps: [
      "Send welcome SMS + email",
      "Create secure portal login",
      "Request credit report PDF + ID upload",
      "Auto-create onboarding tasks",
      "Notify Jonathan",
    ],
    status: "Active",
    runs: 38,
  },
  {
    id: "a2",
    name: "AI Credit Analysis",
    trigger: "Credit report PDF uploaded",
    steps: [
      "Parse PDF → extract tradelines, scores, negatives",
      "AI generates detailed analysis + risk factors",
      "Build personalized score-improvement roadmap",
      "Email branded analysis to client",
      "Attach recommended dispute targets",
    ],
    status: "Active",
    runs: 52,
  },
  {
    id: "a3",
    name: "Goal-Based Game Plan",
    trigger: "Client goal selected (Home / Car / Business…)",
    steps: [
      "Map current profile vs. goal requirements",
      "AI drafts 6–12 month milestone plan",
      "Set utilization + tradeline targets",
      "Schedule monthly check-in reminders",
      "Deliver plan to client portal",
    ],
    status: "Active",
    runs: 41,
  },
  {
    id: "a4",
    name: "Atomic Dispute Engine",
    trigger: "Dispute round approved",
    steps: [
      "Select strategy per negative item",
      "Generate unique, non-templated letters",
      "Queue certified mail / e-delivery",
      "Set 30-day bureau response timer",
      "Log round to client timeline",
    ],
    status: "Active",
    runs: 117,
  },
  {
    id: "a5",
    name: "30-Day Bureau Follow-up",
    trigger: "30 days after dispute mailed",
    steps: [
      "Check for bureau response",
      "If no response → auto-draft escalation (MOV)",
      "If deletions → SMS client the win 🎉",
      "Update score tracker + documents",
    ],
    status: "Active",
    runs: 96,
  },
  {
    id: "a6",
    name: "Payment & Retention",
    trigger: "Invoice due / card declined",
    steps: [
      "Send friendly payment reminder",
      "Retry card / send secure pay link",
      "Flag past-due in CRM",
      "Pause disputes if 2 cycles missed",
    ],
    status: "Active",
    runs: 64,
  },
];
