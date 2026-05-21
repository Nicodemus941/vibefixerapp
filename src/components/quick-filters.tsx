"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PRESETS: { label: string; params: Record<string, string> }[] = [
  { label: "Best deal", params: { sort: "best-deal" } },
  { label: "Under $20K", params: { priceMax: "20000" } },
  { label: "Under $30K", params: { priceMax: "30000" } },
  { label: "Private only", params: { sellerType: "private" } },
  { label: "Manual", params: { q: "manual" } },
  { label: "AWD/4WD", params: { q: "AWD" } },
  { label: "EV", params: { q: "Electric" } },
  { label: "Low miles", params: { mileageMax: "40000" } },
  { label: "Newest first", params: { sort: "newest" } },
];

export function QuickFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const isActive = (preset: Record<string, string>) =>
    Object.entries(preset).every(([k, v]) => params.get(k) === v);

  function toggle(preset: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    if (isActive(preset)) {
      Object.keys(preset).forEach((k) => sp.delete(k));
    } else {
      Object.entries(preset).forEach(([k, v]) => sp.set(k, v));
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => {
        const active = isActive(p.params);
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => toggle(p.params)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                : "border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)]"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
