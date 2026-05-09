import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "../TopBar";
import { isMockMode, listBlocks } from "../../lib/store";
import { buildBlockLookup, generateDays } from "../../lib/slots";
import { toggleBlockedDay } from "../actions";

export const metadata: Metadata = {
  title: "Calendar · Ops cockpit",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const blocks = await listBlocks();
  const lookup = buildBlockLookup(blocks);
  // Generate the next 14 days WITHOUT applying blocks, so we can show
  // every slot and let the operator toggle each one.
  const days = generateDays(new Date(), 14);

  return (
    <div className="min-h-screen bg-bone">
      <TopBar mockMode={isMockMode()} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="headline text-2xl font-extrabold sm:text-3xl">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Block off whole days or individual slots. Customers won't see them
              on the booking page.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-bold text-ink-muted hover:text-ink"
          >
            ← Back to today
          </Link>
        </div>

        <div className="mt-8 space-y-3">
          {days.map((day) => {
            const dayBlocked = lookup.blockedDates.has(day.date);
            return (
              <article
                key={day.date}
                className={`rounded-2xl border p-4 transition sm:p-5 ${
                  dayBlocked
                    ? "border-flame bg-flame/5"
                    : day.isClosed
                    ? "border-line bg-bone"
                    : "border-line bg-white shadow-card"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      {day.isToday ? "Today" : day.isTomorrow ? "Tomorrow" : day.weekdayLong}
                    </div>
                    <div className="text-lg font-extrabold text-ink">
                      {day.monthDayLabel}
                    </div>
                  </div>
                  {day.isClosed && day.closedReason !== "Blocked off" ? (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      {day.closedReason}
                    </span>
                  ) : (
                    <form action={toggleBlockedDay}>
                      <input type="hidden" name="date" value={day.date} />
                      <button
                        type="submit"
                        className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition ${
                          dayBlocked
                            ? "bg-flame text-white hover:bg-flame-bold"
                            : "border border-line bg-white text-ink hover:border-flame hover:text-flame"
                        }`}
                      >
                        {dayBlocked ? "Day blocked · click to unblock" : "Block whole day"}
                      </button>
                    </form>
                  )}
                </div>

                {!day.isClosed && day.slots.length > 0 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {day.slots.map((s) => {
                      const slotBlocked = lookup.blockedSlotIds.has(s.id);
                      return (
                        <form key={s.id} action={toggleBlockedDay}>
                          <input type="hidden" name="date" value={day.date} />
                          <input type="hidden" name="slotId" value={s.id} />
                          <button
                            type="submit"
                            disabled={dayBlocked}
                            className={`flex w-full flex-col items-start rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-50 ${
                              slotBlocked
                                ? "border-flame bg-flame/10 text-flame"
                                : "border-line bg-white text-ink hover:border-flame"
                            }`}
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                              {slotBlocked ? "Blocked" : "Open"}
                            </span>
                            <span className="text-sm font-extrabold">
                              {s.label}
                            </span>
                            <span className="text-[10px] opacity-60">{s.rangeLabel}</span>
                          </button>
                        </form>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
