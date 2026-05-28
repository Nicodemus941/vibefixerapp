"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, Loader2, Plus, Trash2 } from "lucide-react";
import {
  addPosition,
  deletePosition,
  searchOrganizations,
  type PositionRow,
} from "@/app/organizations/actions";

type SearchHit = {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  member_count: number;
};

export function PositionsEditor({
  initial,
  prefillOrgId,
  prefillOrgName,
}: {
  initial: PositionRow[];
  prefillOrgId?: string;
  prefillOrgName?: string;
}) {
  const [positions, setPositions] = useState<PositionRow[]>(initial);
  const [showForm, setShowForm] = useState(Boolean(prefillOrgId));
  const router = useRouter();

  function onAdded(p: PositionRow) {
    setPositions((prev) => [p, ...prev]);
    setShowForm(false);
    router.refresh();
  }

  function onDeleted(id: string) {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-3">
      {positions.length > 0 ? (
        <ul className="space-y-2">
          {positions.map((p) => (
            <PositionRowItem key={p.id} position={p} onDelete={onDeleted} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--fg-muted)]">
          Nothing yet. Add a position to show your current and past roles on your profile.
        </p>
      )}

      {showForm ? (
        <AddPositionForm
          onAdded={onAdded}
          onCancel={() => setShowForm(false)}
          prefillOrgId={prefillOrgId}
          prefillOrgName={prefillOrgName}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.05]"
        >
          <Plus className="h-4 w-4" />
          Add position
        </button>
      )}
    </div>
  );
}

function PositionRowItem({
  position,
  onDelete,
}: {
  position: PositionRow;
  onDelete: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Remove this position?")) return;
    startTransition(async () => {
      const r = await deletePosition(position.id);
      if (!r.error) onDelete(position.id);
    });
  }

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 flex items-start gap-3">
      <Briefcase className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--fg)] break-words">{position.title}</p>
        <p className="text-xs text-[var(--fg-muted)]">
          {position.organization_slug ? (
            <Link
              href={`/o/${position.organization_slug}`}
              className="hover:underline underline-offset-2 text-[var(--accent)]"
            >
              {position.resolved_name}
            </Link>
          ) : (
            position.resolved_name
          )}
        </p>
        <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-0.5 tabular-nums">
          {formatRange(position.start_date, position.end_date, position.is_current)}
        </p>
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label="Remove position"
        className="press-shrink inline-flex items-center justify-center h-8 w-8 rounded-full text-[var(--fg-subtle)] hover:bg-white/[0.04] hover:text-[var(--danger)]"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </li>
  );
}

function AddPositionForm({
  onAdded,
  onCancel,
  prefillOrgId,
  prefillOrgName,
}: {
  onAdded: (p: PositionRow) => void;
  onCancel: () => void;
  prefillOrgId?: string;
  prefillOrgName?: string;
}) {
  const [title, setTitle] = useState("");
  const [orgQuery, setOrgQuery] = useState(prefillOrgName ?? "");
  const [orgId, setOrgId] = useState<string | null>(prefillOrgId ?? null);
  const [orgName, setOrgName] = useState<string | null>(prefillOrgName ?? null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (orgId) return; // org already picked
    if (orgQuery.trim().length < 2) {
      setHits([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      const results = await searchOrganizations(orgQuery);
      setHits(results);
    }, 200);
  }, [orgQuery, orgId]);

  function pickOrg(hit: SearchHit) {
    setOrgId(hit.id);
    setOrgName(hit.name);
    setOrgQuery(hit.name);
    setShowResults(false);
  }

  function clearOrg() {
    setOrgId(null);
    setOrgName(null);
    setOrgQuery("");
    setHits([]);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await addPosition({
        organizationId: orgId,
        organizationName: orgId ? null : orgQuery.trim() || null,
        title: title.trim(),
        startDate,
        endDate: isCurrent ? null : endDate || null,
        isCurrent,
        description: description.trim() || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      // Optimistically add to the list. The next router.refresh() will
      // replace this stub with the real server row.
      onAdded({
        id: crypto.randomUUID(),
        organization_id: orgId,
        organization_name: orgId ? null : orgQuery.trim() || null,
        organization_slug: null,
        organization_logo_url: null,
        resolved_name: orgName ?? orgQuery.trim(),
        title: title.trim(),
        start_date: startDate,
        end_date: isCurrent ? null : endDate || null,
        is_current: isCurrent,
        description: description.trim() || null,
      });
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.04] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
          Add position
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)]"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 160))}
          placeholder="Founder, Head of Growth, Senior iOS engineer…"
          className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      <div className="relative">
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
          Company
        </label>
        <input
          value={orgQuery}
          onChange={(e) => {
            setOrgQuery(e.target.value);
            if (orgId) setOrgId(null);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search Loop companies or type a name"
          className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        {orgId && (
          <button
            type="button"
            onClick={clearOrg}
            className="absolute right-2 top-[34px] text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)]"
          >
            Clear link
          </button>
        )}
        {showResults && hits.length > 0 && !orgId && (
          <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-xl max-h-72 overflow-auto">
            {hits.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => pickOrg(h)}
                className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="text-sm text-[var(--fg)] truncate">{h.name}</p>
                  <p className="font-mono text-[10px] text-[var(--fg-subtle)] truncate">
                    {h.industry ?? "—"} · {h.member_count} on Loop
                  </p>
                </div>
              </button>
            ))}
            <Link
              href="/organizations/new"
              className="block px-3 py-2 text-xs text-[var(--accent)] hover:bg-white/[0.04] border-t border-[var(--border)]"
            >
              Can&apos;t find it? Create the company page
            </Link>
          </div>
        )}
        {!orgId && orgQuery.length >= 2 && (
          <p className="mt-1 font-mono text-[10px] text-[var(--fg-subtle)]">
            No match? Keep typing — Loop will store the name as-is.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
            End date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isCurrent}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-40"
          />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-[var(--fg-muted)]">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => {
            setIsCurrent(e.target.checked);
            if (e.target.checked) setEndDate("");
          }}
          className="h-4 w-4"
        />
        I currently work here
      </label>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
          What you do / did (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
          rows={2}
          placeholder="Shipped X, led Y, scaled to Z..."
          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !title.trim() || !startDate || (!isCurrent && !endDate)}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save position
      </button>
    </div>
  );
}

function formatRange(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (s: string) => {
    const d = new Date(s);
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  };
  if (isCurrent) return `${fmt(start)} — Present`;
  if (end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt(start);
}
