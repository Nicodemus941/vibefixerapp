// Bookable-slot generator.
//
// Generates the next 7 days of available windows from a fixed configuration.
// No database — Eric tunes availability by editing this file (or, later,
// we wire in real persistence so booked slots get filtered out).
//
// Honesty rules:
// - We never fake scarcity. The "Last slot today" badge is true (it's the
//   last one of the day). The "Booking fast" hint is true relative to slot
//   count. No fake "only 2 left."
// - Slots that have passed (today, after the start time + buffer) are
//   filtered out. Same for "next-day-only" cutoffs after 4 PM.

const TZ = "America/New_York";

export type Slot = {
  id: string;        // e.g. "2026-05-12T10:30"
  date: string;      // YYYY-MM-DD (in business TZ)
  startMinutes: number; // minutes from midnight (in business TZ)
  endMinutes: number;
  label: string;     // "10:30 AM"
  rangeLabel: string; // "10:30 AM – 12:00 PM"
  isLast: boolean;   // last slot of that day
};

export type Day = {
  date: string;
  weekdayShort: string; // "Tue"
  weekdayLong: string;  // "Tuesday"
  monthDayLabel: string; // "May 12"
  isToday: boolean;
  isTomorrow: boolean;
  isClosed: boolean;     // business closed that day
  closedReason?: string; // e.g. "Closed Sundays"
  slots: Slot[];
};

// 0 = Sun, 1 = Mon, … 6 = Sat
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Per-day open ranges in 24h hours. null = closed.
// F.A.S.T. is family-owned mobile, so we keep wider Mon-Sat hours and
// closed on Sunday by default. After-hours ("evening" slots) are
// handled via the LATE_SLOTS list below.
const HOURS: Record<DayOfWeek, [number, number] | null> = {
  0: null,         // Sunday — closed
  1: [8, 18],      // Mon 8a-6p
  2: [8, 18],
  3: [8, 18],
  4: [8, 18],
  5: [8, 18],
  6: [9, 17],      // Sat 9a-5p
};

// Slot start times within the open window (24h, "HH:MM").
// Each slot is SLOT_LENGTH_MIN long. Picked to give 4-5 slots/day with
// natural lunch break, matching how a mobile installer actually moves.
const SLOT_STARTS_BY_DAY: Record<DayOfWeek, string[] | null> = {
  0: null,
  1: ["08:00", "10:00", "12:30", "14:30", "16:30"],
  2: ["08:00", "10:00", "12:30", "14:30", "16:30"],
  3: ["08:00", "10:00", "12:30", "14:30", "16:30"],
  4: ["08:00", "10:00", "12:30", "14:30", "16:30"],
  5: ["08:00", "10:00", "12:30", "14:30", "16:30"],
  6: ["09:00", "11:00", "13:30", "15:30"],
};

const SLOT_LENGTH_MIN = 90;

// Same-day buffer: if "now" is within this many minutes of a slot start,
// hide it. Gives Eric a chance to pack the truck.
const SAME_DAY_BUFFER_MIN = 120;

// "Next-day install" hard cutoff. After this hour, tomorrow's earliest
// slot is hidden so we don't overpromise.
const NEXT_DAY_CUTOFF_HOUR = 16; // 4 PM

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// Returns the year/month/day/dow/hour/min as seen in America/New_York,
// no matter what the server's TZ is.
function inBusinessTz(d: Date) {
  // Use Intl with America/New_York to extract parts.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = fmt.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const dowMap: Record<string, DayOfWeek> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    dow: dowMap[parts.weekday] as DayOfWeek,
  };
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Compute YMD `n` days after the given date in the business TZ.
function dayPlus(base: Date, n: number) {
  const ms = base.getTime() + n * 24 * 60 * 60 * 1000;
  return inBusinessTz(new Date(ms));
}

function fmtTime(totalMin: number): string {
  const h24 = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export function generateDays(now: Date = new Date(), days = 7): Day[] {
  const today = inBusinessTz(now);
  const result: Day[] = [];

  for (let i = 0; i < days; i++) {
    const d = dayPlus(now, i);
    const dow = d.dow;
    const dateStr = ymd(d.year, d.month, d.day);
    const monthDayLabel = `${MONTH_SHORT[d.month - 1]} ${d.day}`;
    const weekdayShort = WEEKDAY_SHORT[dow];
    const weekdayLong = WEEKDAY_LONG[dow];

    const isToday = i === 0;
    const isTomorrow = i === 1;

    if (HOURS[dow] === null) {
      result.push({
        date: dateStr,
        weekdayShort,
        weekdayLong,
        monthDayLabel,
        isToday,
        isTomorrow,
        isClosed: true,
        closedReason: "We're closed Sundays",
        slots: [],
      });
      continue;
    }

    const starts = SLOT_STARTS_BY_DAY[dow] ?? [];
    const slots: Slot[] = [];

    for (let s = 0; s < starts.length; s++) {
      const startMin = parseHHMM(starts[s]);
      const endMin = startMin + SLOT_LENGTH_MIN;

      // Filter past slots if it's today.
      if (isToday) {
        const nowMin = today.hour * 60 + today.minute;
        if (startMin - nowMin < SAME_DAY_BUFFER_MIN) continue;
      }

      // Hide tomorrow's earliest slot if we're already past today's
      // 4 PM next-day cutoff (we wouldn't have time to prep).
      if (isTomorrow && today.hour >= NEXT_DAY_CUTOFF_HOUR && s === 0) continue;

      slots.push({
        id: `${dateStr}T${starts[s]}`,
        date: dateStr,
        startMinutes: startMin,
        endMinutes: endMin,
        label: fmtTime(startMin),
        rangeLabel: `${fmtTime(startMin)} – ${fmtTime(endMin)}`,
        isLast: false, // set below
      });
    }

    // Mark the last available slot for that day so we can render an
    // honest "Last slot today" badge.
    if (slots.length > 0) slots[slots.length - 1].isLast = true;

    result.push({
      date: dateStr,
      weekdayShort,
      weekdayLong,
      monthDayLabel,
      isToday,
      isTomorrow,
      isClosed: false,
      slots,
    });
  }

  return result;
}

export function findSlot(slotId: string, days: readonly Day[]): Slot | null {
  for (const d of days) {
    const s = d.slots.find((x) => x.id === slotId);
    if (s) return s;
  }
  return null;
}

export function describeSlot(slot: Slot): {
  weekdayLong: string;
  monthDayLabel: string;
  rangeLabel: string;
  isToday: boolean;
  isTomorrow: boolean;
} {
  // Recompute display info from the slot's date string + a fresh
  // "today" reference so the description survives serialization.
  const [y, m, d] = slot.date.split("-").map(Number);
  // Naive Date construction (slot.date is a calendar date in the business TZ).
  // We use it only to derive day-of-week, which is unaffected by TZ.
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() as DayOfWeek;

  const today = inBusinessTz(new Date());
  const todayStr = ymd(today.year, today.month, today.day);
  const tomorrow = dayPlus(new Date(), 1);
  const tomorrowStr = ymd(tomorrow.year, tomorrow.month, tomorrow.day);

  return {
    weekdayLong: WEEKDAY_LONG[dow],
    monthDayLabel: `${MONTH_SHORT[m - 1]} ${d}`,
    rangeLabel: slot.rangeLabel,
    isToday: slot.date === todayStr,
    isTomorrow: slot.date === tomorrowStr,
  };
}
