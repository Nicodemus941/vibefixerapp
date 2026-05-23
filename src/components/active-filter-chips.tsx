"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LABELS: Record<string, (v: string) => string> = {
  q: (v) => `"${v}"`,
  make: (v) => `Make: ${v}`,
  body: (v) => `Body: ${v}`,
  yearMin: (v) => `Year ≥ ${v}`,
  yearMax: (v) => `Year ≤ ${v}`,
  priceMin: (v) => `≥ $${Number(v).toLocaleString()}`,
  priceMax: (v) => `≤ $${Number(v).toLocaleString()}`,
  mileageMax: (v) => `≤ ${Number(v).toLocaleString()} mi`,
  sellerType: (v) => (v === "private" ? "Private sellers" : "Dealers"),
  state: (v) => `State: ${v}`,
  sort: (v) => `Sort: ${v.replace("-", " ")}`,
};

const SKIP_KEYS = new Set(["sort"]);

export function ActiveFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const entries = Array.from(params.entries()).filter(
    ([k, v]) => v && LABELS[k] && !SKIP_KEYS.has(k),
  );
  if (entries.length === 0) return null;

  function remove(key: string) {
    const sp = new URLSearchParams(params.toString());
    sp.delete(key);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map(([k, v]) => (
        <button
          key={k}
          type="button"
          onClick={() => remove(k)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-ink)] hover:bg-[var(--color-brand)] hover:text-white"
        >
          {LABELS[k](v)}
          <span aria-hidden>×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-brand)] hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
