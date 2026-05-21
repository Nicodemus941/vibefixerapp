import { dealLabel } from "@/lib/format";

export function DealBadge({ score }: { score: number | null }) {
  const { label, tone } = dealLabel(score);
  const styles: Record<string, string> = {
    great: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
    good: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
    fair: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
    over: "bg-[var(--color-bad-soft)] text-[var(--color-bad)]",
    neutral: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${styles[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
