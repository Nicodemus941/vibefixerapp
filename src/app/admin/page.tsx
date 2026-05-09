import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "./TopBar";
import Scoreboard from "./Scoreboard";
import EntryCard from "./EntryCard";
import { dailyStats, isMockMode, listEntries } from "../lib/store";

export const metadata: Metadata = {
  title: "Today · Ops cockpit",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function SectionHeading({
  title,
  count,
  tone = "default",
}: {
  title: string;
  count: number;
  tone?: "default" | "hot" | "soft";
}) {
  const ringClass =
    tone === "hot"
      ? "border-flame bg-flame text-white"
      : tone === "soft"
      ? "border-line bg-white text-ink-muted"
      : "border-brand bg-brand text-white";
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-extrabold uppercase tracking-[0.18em] text-ink-muted sm:text-lg sm:tracking-[0.16em]">
        {title}
      </h2>
      <span
        className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-full border px-2 text-xs font-extrabold ${ringClass}`}
      >
        {count}
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-white p-6 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}

export default async function AdminTodayPage() {
  const [stats, allEntries] = await Promise.all([
    dailyStats(),
    listEntries({ limit: 200 }),
  ]);

  const hot = allEntries.filter((e) => e.status === "new");
  const todayBookings = stats.todayBookingsList;
  const recentlyCompleted = allEntries
    .filter((e) => e.status === "completed")
    .slice(0, 6);
  const inFlight = allEntries.filter(
    (e) => e.status === "contacted" || e.status === "booked",
  ).filter((e) => !todayBookings.some((b) => b.id === e.id)).slice(0, 8);

  const mock = isMockMode();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning, Eric.";
    if (h < 18) return "Good afternoon, Eric.";
    return "Good evening, Eric.";
  })();

  return (
    <div className="min-h-screen bg-bone">
      <TopBar mockMode={mock} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Greeting + day */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="headline text-2xl font-extrabold sm:text-3xl">
              {greeting}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              · here's the pulse.
            </p>
          </div>
          {mock ? (
            <div className="rounded-xl border border-amber/40 bg-amber/10 px-3 py-2 text-xs font-semibold text-ink">
              Demo data shown. Connect Vercel KV in project settings to see real
              leads here.
            </div>
          ) : null}
        </div>

        {/* Scoreboard */}
        <div className="mt-6">
          <Scoreboard stats={stats} />
        </div>

        {/* HOT — uncontacted leads */}
        <section className="mt-10 space-y-3">
          <SectionHeading title="Hot · uncontacted" count={hot.length} tone="hot" />
          {hot.length === 0 ? (
            <Empty>
              No uncontacted leads. Every red row would mean money waiting —
              you're caught up.
            </Empty>
          ) : (
            <div className="space-y-3">
              {hot.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </section>

        {/* Today's installs */}
        <section className="mt-10 space-y-3">
          <SectionHeading
            title="Today's installs"
            count={todayBookings.length}
            tone="default"
          />
          {todayBookings.length === 0 ? (
            <Empty>No installs scheduled today. Day's open for walk-ins.</Empty>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </section>

        {/* In-flight: contacted or booked but not today */}
        {inFlight.length > 0 ? (
          <section className="mt-10 space-y-3">
            <SectionHeading
              title="In flight"
              count={inFlight.length}
              tone="soft"
            />
            <div className="space-y-3">
              {inFlight.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Recently completed */}
        {recentlyCompleted.length > 0 ? (
          <section className="mt-10 space-y-3">
            <SectionHeading
              title="Recently completed"
              count={recentlyCompleted.length}
              tone="soft"
            />
            <div className="space-y-3">
              {recentlyCompleted.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 text-center">
          <Link
            href="/admin/inbox"
            className="text-sm font-bold text-ink-muted hover:text-ink"
          >
            See all leads &amp; bookings →
          </Link>
        </div>
      </main>
    </div>
  );
}
