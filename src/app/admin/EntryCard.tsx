import {
  CLAIM_STATUS_LABEL,
  TECH_LABEL,
  TECH_OPTIONS,
  type Entry,
} from "../lib/store";
import StatusPill from "./StatusPill";
import {
  addPhoto,
  completeAndAskForReview,
  removePhoto,
  setAssignedTo,
  setClaim,
  setNotes,
  setPrice,
  setStatus,
} from "./actions";

const SERVICE_LABEL: Record<string, string> = {
  "chip-repair": "Chip / crack",
  "windshield-replace": "Windshield",
  "side-back": "Side / rear",
  "not-sure": "Not sure yet",
};

const SOURCE_LABEL: Record<string, string> = {
  quote: "Quote form",
  booking: "Online booking",
  "fast-lead": "Exit-intent",
};

function fmtPhoneDial(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d[0] === "1") return `+${d}`;
  return phone;
}

function fmtElapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function urgencyClass(iso: string, status: Entry["status"]): string {
  if (status !== "new") return "";
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m > 15) return "ring-2 ring-flame ring-offset-2 ring-offset-bone";
  if (m > 5) return "ring-1 ring-flame/60";
  return "";
}

function fmtMoney(v?: number): string {
  if (v == null || !Number.isFinite(v)) return "";
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function EntryCard({ entry }: { entry: Entry }) {
  const dial = fmtPhoneDial(entry.phone);
  const sms = `sms:${dial}`;
  const tel = `tel:${dial}`;
  const mapsUrl = entry.zip
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.zip + " FL")}`
    : null;
  const tech: Entry["assignedTo"] = entry.assignedTo ?? "unassigned";
  const isReturning = (entry.priorVisitsCount ?? 0) > 0;

  return (
    <article
      className={`rounded-2xl border border-line bg-white shadow-card transition ${urgencyClass(entry.receivedAt, entry.status)}`}
    >
      {/* Header strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
        <StatusPill status={entry.status} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          {SOURCE_LABEL[entry.source]}
        </span>
        <span className="text-[11px] font-medium text-ink-muted">
          · {fmtElapsed(entry.receivedAt)}
        </span>
        {isReturning ? (
          <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-brand-deep">
            Returning · {entry.priorVisitsCount}+ prior
          </span>
        ) : null}
        {entry.slotDayLabel ? (
          <span className="ml-auto rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-deep">
            {entry.slotDayLabel} · {entry.slotRangeLabel}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:px-5 sm:py-5">
        <div className="min-w-0">
          <div className="text-lg font-extrabold text-ink">{entry.name}</div>
          <div className="mt-0.5 text-sm text-ink-muted">
            {entry.vehicle ?? "Vehicle TBD"}
            {entry.service ? ` · ${SERVICE_LABEL[entry.service] ?? entry.service}` : ""}
            {entry.insurance ? ` · ${entry.insurance}` : ""}
            {entry.zip ? ` · ${entry.zip}` : ""}
          </div>
          {entry.damage ? (
            <p className="mt-2 text-sm text-ink/80">{entry.damage}</p>
          ) : null}
          {entry.notes ? (
            <p className="mt-2 rounded-lg bg-bone px-3 py-2 text-xs text-ink-muted">
              <span className="font-bold uppercase tracking-wider text-amber-bold">Notes:</span>{" "}
              {entry.notes}
            </p>
          ) : null}
          {entry.referredBy ? (
            <p className="mt-2 text-xs font-bold text-amber-bold">
              Referred by {entry.referredBy} — credit both sides.
            </p>
          ) : null}
        </div>

        {/* Primary actions — phone is dominant */}
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <a
            href={tel}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-extrabold text-ink shadow-pop transition hover:bg-amber-bold sm:flex-initial"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z"
              />
            </svg>
            Call
          </a>
          <a
            href={sms}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-amber sm:flex-initial"
          >
            Text
          </a>
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-amber sm:flex-initial"
            >
              Map
            </a>
          ) : null}
        </div>
      </div>

      {/* Status changer + review-ask button */}
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-bone px-4 py-3 sm:px-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Mark as
        </span>
        {(["contacted", "booked", "no-show"] as const).map((s) => (
          <form key={s} action={setStatus} className="inline">
            <input type="hidden" name="id" value={entry.id} />
            <input type="hidden" name="status" value={s} />
            <button
              type="submit"
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink transition hover:border-amber hover:bg-amber/10"
            >
              {s === "contacted" ? "Called" : s === "booked" ? "Booked" : "No-show"}
            </button>
          </form>
        ))}
        <form action={completeAndAskForReview} className="inline">
          <input type="hidden" name="id" value={entry.id} />
          <button
            type="submit"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-emerald-700"
          >
            ✓ Done · send review SMS
          </button>
        </form>
      </div>

      {/* Tech assignment + price + insurance claim */}
      <div className="grid gap-3 border-t border-line bg-white px-4 py-4 text-sm sm:grid-cols-3 sm:px-5">
        <form action={setAssignedTo} className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Assigned to
          </label>
          <div className="flex gap-2">
            <select
              name="tech"
              defaultValue={tech}
              className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
            >
              {TECH_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TECH_LABEL[t]}
                </option>
              ))}
            </select>
            <input type="hidden" name="id" value={entry.id} />
            <button
              type="submit"
              className="rounded-lg bg-ink px-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-ink-soft"
            >
              Save
            </button>
          </div>
        </form>

        <form action={setPrice} className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Price · quoted / paid
          </label>
          <div className="flex gap-2">
            <input
              type="hidden"
              name="id"
              value={entry.id}
            />
            <input
              name="priceQuoted"
              defaultValue={entry.priceQuoted ?? ""}
              inputMode="decimal"
              placeholder="$ Quote"
              className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
            />
            <input
              name="pricePaid"
              defaultValue={entry.pricePaid ?? ""}
              inputMode="decimal"
              placeholder="$ Paid"
              className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-ink px-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-ink-soft"
            >
              Save
            </button>
          </div>
        </form>

        <form action={setClaim} className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Insurance claim
          </label>
          <div className="flex gap-2">
            <input type="hidden" name="id" value={entry.id} />
            <input
              name="claimNumber"
              defaultValue={entry.claimNumber ?? ""}
              placeholder="Claim #"
              className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
            />
            <select
              name="claimStatus"
              defaultValue={entry.claimStatus ?? ""}
              className="block w-32 rounded-lg border border-line bg-white px-2 py-2 text-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
            >
              <option value="">— Status —</option>
              {(Object.keys(CLAIM_STATUS_LABEL) as (keyof typeof CLAIM_STATUS_LABEL)[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {CLAIM_STATUS_LABEL[s]}
                  </option>
                ),
              )}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-ink px-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-ink-soft"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Photos */}
      {entry.photos && entry.photos.length > 0 ? (
        <div className="border-t border-line px-4 py-3 sm:px-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Photos
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {entry.photos.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-bone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Job photo"
                  className="h-full w-full object-cover"
                />
                <form
                  action={removePhoto}
                  className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100"
                >
                  <input type="hidden" name="id" value={entry.id} />
                  <input type="hidden" name="url" value={url} />
                  <button
                    type="submit"
                    className="rounded-full bg-flame/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Add photo URL + notes */}
      <details className="group border-t border-line">
        <summary className="cursor-pointer list-none px-4 py-2 text-xs font-bold text-ink-muted hover:text-ink sm:px-5">
          + Add photo or note
          <span className="float-right transition group-open:rotate-180">▾</span>
        </summary>
        <div className="space-y-3 px-4 pb-4 sm:px-5">
          <form action={addPhoto} className="flex gap-2">
            <input type="hidden" name="id" value={entry.id} />
            <input
              name="photoUrl"
              type="url"
              placeholder="Paste photo URL (https://…)"
              className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-ink px-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-ink-soft"
            >
              Add photo
            </button>
          </form>
          <form action={setNotes}>
            <input type="hidden" name="id" value={entry.id} />
            <textarea
              name="notes"
              defaultValue={entry.notes ?? ""}
              rows={2}
              placeholder="e.g. wants 8 AM Saturday, has 2 cars to do…"
              className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
            />
            <button
              type="submit"
              className="mt-2 inline-flex items-center rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-ink-soft"
            >
              Save note
            </button>
          </form>
          {(entry.priceQuoted != null || entry.pricePaid != null) ? (
            <p className="text-xs text-ink-muted">
              {entry.priceQuoted != null ? `Quoted ${fmtMoney(entry.priceQuoted)} ` : ""}
              {entry.pricePaid != null ? `· Paid ${fmtMoney(entry.pricePaid)}` : ""}
            </p>
          ) : null}
        </div>
      </details>
    </article>
  );
}
