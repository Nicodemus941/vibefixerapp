"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createGroup } from "../actions";

export function NewGroupForm() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await createGroup({ name, description: desc });
      if (r.error) setError(r.error);
      else if (r.slug) router.push(`/g/${r.slug}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
          Name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          required
          maxLength={60}
          placeholder="e.g. SaaS Founders Boston"
          className="w-full h-11 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
          Description (optional)
        </span>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value.slice(0, 280))}
          rows={3}
          maxLength={280}
          placeholder="Who is this for? What gets posted here?"
          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="press-shrink w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create group
      </button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </form>
  );
}
