import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "../TopBar";
import EntryCard from "../EntryCard";
import { isMockMode, listEntries, type Status, type Source } from "../../lib/store";

export const metadata: Metadata = {
  title: "Inbox · Ops cockpit",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUSES: { value: "" | Status; label: string }[] = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Called" },
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Done" },
  { value: "no-show", label: "No-show" },
];

const SOURCES: { value: "" | Source; label: string }[] = [
  { value: "", label: "Any source" },
  { value: "quote", label: "Quote form" },
  { value: "booking", label: "Booking" },
  { value: "fast-lead", label: "Exit-intent" },
];

type Props = { searchParams: Promise<{ status?: string; source?: string }> };

export default async function AdminInboxPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = (STATUSES.find((s) => s.value === params.status)?.value || "") as
    | ""
    | Status;
  const source = (SOURCES.find((s) => s.value === params.source)?.value || "") as
    | ""
    | Source;

  const entries = await listEntries({
    limit: 200,
    status: status || undefined,
    source: source || undefined,
  });
  const mock = isMockMode();

  function chipHref(p: { status?: string; source?: string }) {
    const sp = new URLSearchParams();
    if (p.status) sp.set("status", p.status);
    if (p.source) sp.set("source", p.source);
    const qs = sp.toString();
    return qs ? `/admin/inbox?${qs}` : "/admin/inbox";
  }

  return (
    <div className="min-h-screen bg-bone">
      <TopBar mockMode={mock} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="headline text-2xl font-extrabold sm:text-3xl">Inbox</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Every lead and booking, newest first.
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Status
          </span>
          {STATUSES.map((s) => {
            const active = (status || "") === s.value;
            return (
              <Link
                key={s.value || "all"}
                href={chipHref({ status: s.value || undefined, source: source || undefined })}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-amber bg-amber text-ink"
                    : "border-line bg-white text-ink-muted hover:border-amber hover:text-ink"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Source
          </span>
          {SOURCES.map((s) => {
            const active = (source || "") === s.value;
            return (
              <Link
                key={s.value || "all"}
                href={chipHref({ status: status || undefined, source: s.value || undefined })}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-ink-muted hover:border-brand hover:text-ink"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 space-y-3">
          {entries.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line bg-white p-6 text-center text-sm text-ink-muted">
              No matching entries.
            </div>
          ) : (
            entries.map((e) => <EntryCard key={e.id} entry={e} />)
          )}
        </div>
      </main>
    </div>
  );
}
