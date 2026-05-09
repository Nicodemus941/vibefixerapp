import type { DailyStats } from "../lib/store";

function Stat({
  label,
  value,
  hot,
}: {
  label: string;
  value: number | string;
  hot?: boolean;
}) {
  return (
    <div
      className={`flex-1 rounded-2xl border p-4 ${
        hot ? "border-flame bg-flame/10" : "border-line bg-white shadow-card"
      }`}
    >
      <div
        className={`text-[11px] font-bold uppercase tracking-wider ${
          hot ? "text-flame" : "text-ink-muted"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl ${
          hot ? "text-flame" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function Scoreboard({ stats }: { stats: DailyStats }) {
  return (
    <section className="grid gap-3 sm:grid-cols-4">
      <Stat label="New leads" value={stats.newQueue} hot={stats.newQueue > 0} />
      <Stat label="Leads today" value={stats.leadsToday} />
      <Stat label="Bookings today" value={stats.bookingsToday} />
      <Stat label="Completed today" value={stats.completedToday} />
    </section>
  );
}
