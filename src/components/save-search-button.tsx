"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SaveSearchButton() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [alerts, setAlerts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasFilters = Array.from(params.entries()).some(([, v]) => v);

  function defaultName() {
    const bits: string[] = [];
    const make = params.get("make");
    const body = params.get("body");
    const priceMax = params.get("priceMax");
    if (make) bits.push(make);
    if (body) bits.push(body);
    if (priceMax) bits.push(`under $${Number(priceMax).toLocaleString()}`);
    if (params.get("q")) bits.push(`"${params.get("q")}"`);
    return bits.length ? bits.join(" ") : "My search";
  }

  async function save() {
    setErr(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      router.push(
        `/auth/sign-in?next=/search?${params.toString()}`,
      );
      return;
    }
    const query: Record<string, string> = {};
    for (const [k, v] of params.entries()) if (v) query[k] = v;
    const { error } = await supabase.from("saved_searches").insert({
      user_id: u.user.id,
      name: name.trim() || defaultName(),
      query,
      alerts_enabled: alerts,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setName("");
    }, 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!hasFilters) {
            setErr("Apply some filters first, then save.");
            return;
          }
          setName(defaultName());
          setErr(null);
          setOpen(true);
        }}
        className="ak-btn ak-btn-ghost border whitespace-nowrap text-sm"
      >
        🔔 Save search
      </button>

      {err && !open && (
        <span className="text-xs text-[var(--color-bad)]">{err}</span>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="ak-card w-full max-w-md space-y-4 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Save this search</h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  We'll email you when new listings match.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-[var(--color-ink-muted)]"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {done ? (
              <div className="rounded-md bg-[var(--color-good-soft)] p-3 text-sm text-[var(--color-good)]">
                ✓ Saved. Manage from your account.
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                    Name
                  </label>
                  <input
                    className="ak-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={alerts}
                    onChange={(e) => setAlerts(e.target.checked)}
                  />
                  Email me when new matches are listed
                </label>
                {err && (
                  <div className="rounded-md bg-[var(--color-bad-soft)] p-2 text-xs text-[var(--color-bad)]">
                    {err}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="ak-btn ak-btn-ghost border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={busy}
                    className="ak-btn ak-btn-primary disabled:opacity-50"
                  >
                    {busy ? "Saving…" : "Save search"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
