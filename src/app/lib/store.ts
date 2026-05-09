import "server-only";

// Tiny persistence layer for the ops dashboard. When Vercel KV is connected
// (env: KV_REST_API_URL + KV_REST_API_TOKEN) every lead/booking is saved to
// a single Redis string keyed `fast:entries:all` as a JSON array, newest
// first. Without KV, we fall back to a realistic mock dataset so the
// dashboard UI is fully usable in preview before storage is wired up.
//
// Why a single JSON blob (instead of a sorted set or list of hashes)? An
// auto-glass shop sees ~10–50 leads/day. Even a year of history fits in a
// few hundred KB. Atomic full-overwrite eliminates index drift bugs from
// concurrent staff updates. Easy to reason about, near-zero ops cost.

export type Status =
  | "new"
  | "contacted"
  | "booked"
  | "completed"
  | "no-show";

export type Source = "quote" | "booking" | "fast-lead";

export type Entry = {
  id: string;
  source: Source;
  status: Status;
  receivedAt: string;
  name: string;
  phone: string;
  vehicle?: string;
  service?: string;
  damage?: string;
  insurance?: string;
  zip?: string;
  referredBy?: string;
  ownReferralCode?: string;
  // booking-specific
  slotStart?: string;
  slotEnd?: string;
  slotDayLabel?: string;
  slotRangeLabel?: string;
  // ops-only
  notes?: string;
  reviewAskSent?: boolean;
};

const MAX_ENTRIES = 500;
const ALL_KEY = "fast:entries:all";

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ---------- Mock data (used only when KV isn't configured) ----------------
// Time-relative so the dashboard demo always feels "today."

function minsAgo(m: number): string {
  return new Date(Date.now() - m * 60 * 1000).toISOString();
}

function MOCK_ENTRIES(): Entry[] {
  return [
    {
      id: "m-001",
      source: "fast-lead",
      status: "new",
      receivedAt: minsAgo(4),
      name: "Maria L.",
      phone: "(941) 555-0177",
      zip: "34287",
      damage: "Captured via exit-intent modal — call back ASAP.",
    },
    {
      id: "m-002",
      source: "quote",
      status: "new",
      receivedAt: minsAgo(11),
      name: "Brandon T.",
      phone: "(941) 555-0142",
      vehicle: "2018 Ford F-150",
      service: "chip-repair",
      insurance: "Progressive",
      zip: "34293",
      damage: "Star chip on driver side, started spreading today",
    },
    {
      id: "m-003",
      source: "booking",
      status: "booked",
      receivedAt: minsAgo(38),
      name: "Janelle K.",
      phone: "(941) 555-0119",
      vehicle: "2023 Honda Pilot",
      service: "windshield-replace",
      insurance: "GEICO",
      zip: "34287",
      slotDayLabel: "Today, " + new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      slotRangeLabel: "2:00 PM – 3:30 PM",
      slotStart: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      slotEnd: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(),
      damage: "Long crack across passenger side",
    },
    {
      id: "m-004",
      source: "booking",
      status: "booked",
      receivedAt: minsAgo(120),
      name: "Carlos M.",
      phone: "(941) 555-0166",
      vehicle: "2020 Honda Civic",
      service: "windshield-replace",
      insurance: "GEICO",
      zip: "34291",
      slotDayLabel: "Tomorrow",
      slotRangeLabel: "10:00 AM – 11:30 AM",
      slotStart: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
      slotEnd: new Date(Date.now() + 27.5 * 3600 * 1000).toISOString(),
      referredBy: "Q5RT2P",
    },
    {
      id: "m-005",
      source: "quote",
      status: "contacted",
      receivedAt: minsAgo(180),
      name: "Dave R.",
      phone: "(941) 555-0108",
      vehicle: "2017 Toyota Tacoma",
      service: "side-back",
      insurance: "Cash",
      zip: "34286",
      notes: "Wants 8am Sat — confirming with him in 1h",
    },
    {
      id: "m-006",
      source: "booking",
      status: "completed",
      receivedAt: minsAgo(60 * 26),
      name: "Lisa S.",
      phone: "(941) 555-0144",
      vehicle: "2019 Toyota Camry",
      service: "chip-repair",
      insurance: "State Farm",
      zip: "34287",
      slotDayLabel: "Yesterday",
      slotRangeLabel: "1:30 PM – 2:30 PM",
      reviewAskSent: false,
    },
    {
      id: "m-007",
      source: "booking",
      status: "completed",
      receivedAt: minsAgo(60 * 50),
      name: "Tony A.",
      phone: "(941) 555-0181",
      vehicle: "2022 Toyota 4Runner",
      service: "windshield-replace",
      insurance: "GEICO",
      zip: "34293",
      slotDayLabel: "2 days ago",
      slotRangeLabel: "10:00 AM – 11:30 AM",
      reviewAskSent: true,
      notes: "Posted 5★ on Google ✓",
    },
    {
      id: "m-008",
      source: "quote",
      status: "no-show",
      receivedAt: minsAgo(60 * 38),
      name: "Frank D.",
      phone: "(941) 555-0193",
      vehicle: "2014 Chevy Silverado",
      service: "windshield-replace",
      insurance: "Cash",
      zip: "34291",
      notes: "Rescheduled twice, ghosted on Tuesday slot",
    },
  ];
}

let mockCache: Entry[] | null = null;
function getMockCache(): Entry[] {
  if (mockCache === null) mockCache = MOCK_ENTRIES();
  return mockCache;
}

// ---------- KV REST API helpers (no extra dep) ----------------------------

async function kvSetString(key: string, value: string): Promise<void> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  // Vercel KV / Upstash REST API: SET via /set/<key> with the value as the body
  await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: value,
    cache: "no-store",
  });
}

async function kvGetString(key: string): Promise<string | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  return data.result ?? null;
}

// ---------- Public API ----------------------------------------------------

async function loadAll(): Promise<Entry[]> {
  if (!isKvConfigured()) return [...getMockCache()];
  const raw = await kvGetString(ALL_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Entry[];
  } catch {
    return [];
  }
}

async function saveAll(entries: Entry[]): Promise<void> {
  const trimmed = entries.slice(0, MAX_ENTRIES);
  if (!isKvConfigured()) {
    mockCache = trimmed;
    return;
  }
  await kvSetString(ALL_KEY, JSON.stringify(trimmed));
}

export async function appendEntry(entry: Entry): Promise<void> {
  const all = await loadAll();
  // Newest first.
  all.unshift(entry);
  await saveAll(all);
}

export type ListOpts = {
  limit?: number;
  offset?: number;
  status?: Status;
  source?: Source;
};

export async function listEntries(opts: ListOpts = {}): Promise<Entry[]> {
  const all = await loadAll();
  let filtered = all;
  if (opts.status) filtered = filtered.filter((e) => e.status === opts.status);
  if (opts.source) filtered = filtered.filter((e) => e.source === opts.source);
  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 200;
  return filtered.slice(offset, offset + limit);
}

export async function getEntry(id: string): Promise<Entry | null> {
  const all = await loadAll();
  return all.find((e) => e.id === id) ?? null;
}

export type Patch = Partial<Pick<Entry, "status" | "notes" | "reviewAskSent">>;

export async function patchEntry(id: string, patch: Patch): Promise<Entry | null> {
  const all = await loadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const next = { ...all[idx], ...patch };
  all[idx] = next;
  await saveAll(all);
  return next;
}

// Aggregate counters for the scoreboard.
export type DailyStats = {
  leadsToday: number;
  bookingsToday: number;
  completedToday: number;
  newQueue: number;        // status="new"
  todayBookingsList: Entry[];
};

export async function dailyStats(): Promise<DailyStats> {
  const all = await loadAll();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const isSameDay = (iso?: string) => !!iso && iso.slice(0, 10) === todayStr;

  const leadsToday = all.filter((e) => isSameDay(e.receivedAt)).length;
  const bookingsToday = all.filter(
    (e) => e.source === "booking" && isSameDay(e.slotStart),
  ).length;
  const completedToday = all.filter(
    (e) => e.status === "completed" && isSameDay(e.receivedAt),
  ).length;
  const newQueue = all.filter((e) => e.status === "new").length;
  const todayBookingsList = all
    .filter((e) => e.source === "booking" && isSameDay(e.slotStart))
    .sort((a, b) => (a.slotStart ?? "").localeCompare(b.slotStart ?? ""));

  return {
    leadsToday,
    bookingsToday,
    completedToday,
    newQueue,
    todayBookingsList,
  };
}

export function isMockMode(): boolean {
  return !isKvConfigured();
}

// Used by id generators in actions/notifications.
export function newEntryId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
