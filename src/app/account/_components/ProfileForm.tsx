"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { updateOwnProfile, type ProfileFormPayload } from "../actions";
import { INDUSTRIES } from "@/lib/industries";

const REVENUE_BANDS = [
  { value: "", label: "Choose…" },
  { value: "pre-revenue", label: "Pre-revenue" },
  { value: "0-10k", label: "$0 – $10k" },
  { value: "10k-100k", label: "$10k – $100k" },
  { value: "100k-1m", label: "$100k – $1M" },
  { value: "1m-10m", label: "$1M – $10M" },
  { value: "10m+", label: "$10M+" },
];

export function ProfileForm({ initial }: { initial: ProfileFormPayload }) {
  const [form, setForm] = useState<ProfileFormPayload>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function set<K extends keyof ProfileFormPayload>(k: K, v: ProfileFormPayload[K]) {
    setForm({ ...form, [k]: v });
    setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await updateOwnProfile(form);
      if (r.error) setError(r.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Display name">
        <input
          value={form.display_name}
          onChange={(e) => set("display_name", e.target.value)}
          required
          disabled={pending}
          className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </Field>
      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value.slice(0, 500))}
          rows={3}
          disabled={pending}
          placeholder="One sentence on what you do."
          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company">
          <input
            value={form.company_name}
            onChange={(e) => set("company_name", e.target.value)}
            disabled={pending}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </Field>
        <Field label="Company URL">
          <input
            type="url"
            value={form.company_url}
            onChange={(e) => set("company_url", e.target.value)}
            disabled={pending}
            placeholder="https://acme.com"
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </Field>
        <Field label="Industry">
          <select
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            disabled={pending}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="" className="bg-[var(--surface-2)]">
              Pick your industry
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i} className="bg-[var(--surface-2)]">
                {i}
              </option>
            ))}
            {form.industry && !INDUSTRIES.includes(form.industry as typeof INDUSTRIES[number]) && (
              <option value={form.industry} className="bg-[var(--surface-2)]">
                {form.industry} (legacy)
              </option>
            )}
          </select>
        </Field>
        <Field label="Revenue band">
          <select
            value={form.revenue_band}
            onChange={(e) => set("revenue_band", e.target.value)}
            disabled={pending}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {REVENUE_BANDS.map((b) => (
              <option key={b.value} value={b.value} className="bg-[var(--surface-2)]">
                {b.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
        {saved && <span className="text-xs text-[var(--accent)]">Saved</span>}
        {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
