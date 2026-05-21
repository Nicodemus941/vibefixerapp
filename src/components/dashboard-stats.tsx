import Link from "next/link";

interface Stat {
  label: string;
  value: number;
  href: string;
  emphasize?: boolean;
}

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className={`ak-card flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
            s.emphasize && s.value > 0
              ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
              : ""
          }`}
        >
          <div
            className={`text-2xl font-bold tracking-tight ${
              s.emphasize && s.value > 0
                ? "text-[var(--color-brand-ink)]"
                : ""
            }`}
          >
            {s.value}
          </div>
          <div className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
            {s.label}
          </div>
        </Link>
      ))}
    </div>
  );
}
