"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface SavedSearch {
  id: string;
  name: string;
  query: Record<string, string>;
  alerts_enabled: boolean;
  created_at: string;
}

export function SavedSearchesList({
  searches,
}: {
  searches: SavedSearch[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (!searches.length) {
    return (
      <div className="ak-card p-6 text-center text-sm text-[var(--color-ink-muted)]">
        No saved searches yet. From{" "}
        <Link href="/search" className="font-semibold text-[var(--color-brand)]">
          /search
        </Link>{" "}
        apply filters and click "Save search".
      </div>
    );
  }

  async function toggleAlerts(id: string, current: boolean) {
    setBusy(id);
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("saved_searches")
      .update({ alerts_enabled: !current })
      .eq("id", id);
    setBusy(null);
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(id);
    const supabase = createSupabaseBrowserClient();
    await supabase.from("saved_searches").delete().eq("id", id);
    setBusy(null);
    router.refresh();
  }

  return (
    <ul className="space-y-3">
      {searches.map((s) => {
        const params = new URLSearchParams(s.query);
        return (
          <li
            key={s.id}
            className="ak-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                href={`/search?${params.toString()}`}
                className="text-sm font-semibold hover:underline"
              >
                {s.name}
              </Link>
              <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
                {summarizeQuery(s.query)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={s.alerts_enabled}
                  disabled={busy === s.id}
                  onChange={() => toggleAlerts(s.id, s.alerts_enabled)}
                />
                Email alerts
              </label>
              <button
                onClick={() => remove(s.id)}
                disabled={busy === s.id}
                className="text-xs font-medium text-[var(--color-bad)] hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function summarizeQuery(q: Record<string, string>) {
  const parts: string[] = [];
  if (q.make) parts.push(q.make);
  if (q.body) parts.push(q.body);
  if (q.priceMax) parts.push(`≤ $${Number(q.priceMax).toLocaleString()}`);
  if (q.mileageMax)
    parts.push(`≤ ${Number(q.mileageMax).toLocaleString()} mi`);
  if (q.sellerType && q.sellerType !== "any")
    parts.push(q.sellerType === "private" ? "Private" : "Dealer");
  if (q.state) parts.push(q.state);
  if (q.q) parts.push(`"${q.q}"`);
  return parts.length ? parts.join(" • ") : "All listings";
}
