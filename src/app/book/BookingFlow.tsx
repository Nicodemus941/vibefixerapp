"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { submitBooking, type BookingState } from "./actions";
import type { Day } from "../lib/slots";
import { normalizeCode } from "../lib/referral";

const REF_STORAGE_KEY = "fast.ref.code";

const initialState: BookingState = { ok: true };

const SERVICES = [
  { value: "chip-repair", label: "Rock chip / small crack" },
  { value: "windshield-replace", label: "Windshield replacement" },
  { value: "side-back", label: "Side, vent, or rear glass" },
  { value: "not-sure", label: "Not sure — please advise" },
];
const VALID_SERVICES = new Set(SERVICES.map((s) => s.value));

function fieldLabel(label: string, sub?: string) {
  return (
    <div className="mb-1">
      <span className="text-sm font-bold text-ink">{label}</span>
      {sub ? (
        <span className="ml-1 text-xs font-medium text-ink-muted">{sub}</span>
      ) : null}
    </div>
  );
}

function dayShortHeader(day: Day): { lead: string; sub: string } {
  if (day.isToday) return { lead: "Today", sub: day.monthDayLabel };
  if (day.isTomorrow) return { lead: "Tomorrow", sub: day.monthDayLabel };
  return { lead: day.weekdayShort, sub: day.monthDayLabel };
}

export default function BookingFlow({ days }: { days: Day[] }) {
  const [state, action, pending] = useActionState(submitBooking, initialState);
  const params = useSearchParams();

  // Pre-fills from /price calculator
  const presetYear = params.get("year")?.trim() ?? "";
  const presetMake = params.get("make")?.trim() ?? "";
  const presetModel = params.get("model")?.trim() ?? "";
  const presetVehicle = [presetYear, presetMake, presetModel]
    .filter(Boolean)
    .join(" ")
    .trim();
  const presetServiceParam = params.get("service")?.trim() ?? "";
  const presetService = VALID_SERVICES.has(presetServiceParam)
    ? presetServiceParam
    : "";

  // First day with at least one slot is the default selected day.
  const firstOpen = days.findIndex((d) => !d.isClosed && d.slots.length > 0);
  const [selectedDate, setSelectedDate] = useState<string>(
    days[firstOpen >= 0 ? firstOpen : 0]?.date ?? "",
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string>("");

  // Pull a referral code from URL (?ref=…) or session storage (set by the
  // ReferralBanner when the visitor first arrived via a /?ref=… link).
  useEffect(() => {
    const fromUrl = normalizeCode(params.get("ref"));
    if (fromUrl) {
      setRefCode(fromUrl);
      try { sessionStorage.setItem(REF_STORAGE_KEY, fromUrl); } catch {}
      return;
    }
    try {
      const stored = sessionStorage.getItem(REF_STORAGE_KEY);
      if (stored) setRefCode(normalizeCode(stored));
    } catch {}
  }, [params]);

  const selectedDay = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  );

  const totalAvailableThisWeek = useMemo(
    () => days.reduce((sum, d) => sum + d.slots.length, 0),
    [days],
  );

  return (
    <form action={action} className="space-y-8">
      {/* Honeypot */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label>
          Company (leave blank)
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>
      <input type="hidden" name="ref" value={refCode} />

      {refCode ? (
        <div className="rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm font-semibold text-ink">
          Friend referral applied · code{" "}
          <span className="rounded bg-ink px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-amber">
            {refCode}
          </span>
          <span className="ml-1 font-medium text-ink-muted">
            — Eric will see this and credit both of you.
          </span>
        </div>
      ) : null}

      {/* STEP 1 — pick a day */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-extrabold text-ink">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber text-xs text-ink">
              1
            </span>
            Pick a day
          </h2>
          <span className="text-xs text-ink-muted">
            {totalAvailableThisWeek} slots available this week
          </span>
        </div>
        <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-2 sm:mx-0">
          {days.map((d) => {
            const head = dayShortHeader(d);
            const disabled = d.isClosed || d.slots.length === 0;
            const active = d.date === selectedDate;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  setSelectedDate(d.date);
                  setSelectedSlotId(null);
                }}
                disabled={disabled}
                className={`flex min-w-[88px] shrink-0 flex-col items-center rounded-2xl border px-4 py-3 transition ${
                  active
                    ? "border-amber bg-amber text-ink shadow-pop"
                    : disabled
                    ? "border-line bg-bone text-ink-muted opacity-60"
                    : "border-line bg-white text-ink hover:border-amber"
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {head.lead}
                </span>
                <span className="mt-0.5 text-base font-extrabold">{head.sub}</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-70">
                  {d.isClosed
                    ? "Closed"
                    : d.slots.length === 0
                    ? "Full"
                    : `${d.slots.length} slot${d.slots.length === 1 ? "" : "s"}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 2 — pick a time */}
      <section>
        <h2 className="text-base font-extrabold text-ink">
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber text-xs text-ink">
            2
          </span>
          Pick a time
        </h2>
        {selectedDay && selectedDay.slots.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {selectedDay.slots.map((s) => {
              const active = selectedSlotId === s.id;
              return (
                <label
                  key={s.id}
                  className={`relative flex cursor-pointer flex-col items-start rounded-2xl border p-3.5 text-sm transition ${
                    active
                      ? "border-amber bg-amber/15 ring-2 ring-amber"
                      : "border-line bg-white hover:border-amber"
                  }`}
                >
                  <input
                    type="radio"
                    name="slot"
                    value={s.id}
                    checked={active}
                    onChange={() => setSelectedSlotId(s.id)}
                    className="sr-only"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    {selectedDay.isToday
                      ? "Today"
                      : selectedDay.isTomorrow
                      ? "Tomorrow"
                      : selectedDay.weekdayShort}
                  </span>
                  <span className="mt-0.5 text-base font-extrabold text-ink">
                    {s.label}
                  </span>
                  <span className="mt-0.5 text-[11px] text-ink-muted">
                    {s.rangeLabel}
                  </span>
                  {s.isLast ? (
                    <span className="mt-2 inline-flex rounded-full bg-flame/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-flame">
                      {selectedDay.isToday ? "Last slot today" : "Last of the day"}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-line bg-bone p-4 text-sm text-ink-muted">
            {selectedDay?.isClosed
              ? selectedDay.closedReason
              : "All booked for this day. Try another day above."}
          </p>
        )}
        {state.errors?.slot ? (
          <p className="mt-2 text-xs font-semibold text-flame">{state.errors.slot}</p>
        ) : null}
      </section>

      {/* STEP 3 — your details */}
      <section>
        <h2 className="text-base font-extrabold text-ink">
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber text-xs text-ink">
            3
          </span>
          Your details
        </h2>

        <div className="mt-3 space-y-4">
          <div>
            {fieldLabel("Name")}
            <input
              name="name"
              required
              autoComplete="name"
              placeholder="Jane Smith"
              className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
            />
            {state.errors?.name ? (
              <p className="mt-1 text-xs font-semibold text-flame">{state.errors.name}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {fieldLabel("Phone", "(we'll text you 30 min before)")}
              <input
                name="phone"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="(941) 555-0123"
                className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
              />
              {state.errors?.phone ? (
                <p className="mt-1 text-xs font-semibold text-flame">{state.errors.phone}</p>
              ) : null}
            </div>
            <div>
              {fieldLabel("ZIP", "(where we should meet you)")}
              <input
                name="zip"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="34287"
                className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
              />
            </div>
          </div>

          <div>
            {fieldLabel("Vehicle", "(year, make, model)")}
            <input
              name="vehicle"
              required
              defaultValue={presetVehicle}
              placeholder="2021 Toyota RAV4"
              className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
            />
            {state.errors?.vehicle ? (
              <p className="mt-1 text-xs font-semibold text-flame">{state.errors.vehicle}</p>
            ) : null}
          </div>

          <div>
            {fieldLabel("What do you need?")}
            <div className="grid gap-2 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <label
                  key={s.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium transition hover:border-amber has-[input:checked]:border-amber has-[input:checked]:bg-amber/10"
                >
                  <input
                    type="radio"
                    name="service"
                    value={s.value}
                    required
                    defaultChecked={presetService === s.value}
                    className="h-4 w-4 accent-amber"
                  />
                  {s.label}
                </label>
              ))}
            </div>
            {state.errors?.service ? (
              <p className="mt-1 text-xs font-semibold text-flame">{state.errors.service}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {fieldLabel("Insurance", "(optional — we'll file the claim)")}
              <input
                name="insurance"
                placeholder="GEICO / Progressive / cash"
                className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
              />
            </div>
            <div>
              {fieldLabel("Damage", "(optional — describe briefly)")}
              <input
                name="damage"
                placeholder="Chip on driver side, no crack yet"
                className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
              />
            </div>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber px-6 py-5 text-base font-extrabold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold disabled:cursor-wait disabled:opacity-70 sm:text-lg"
      >
        {pending ? "Locking your slot..." : "Lock in this slot →"}
      </button>

      <p className="text-center text-xs text-ink-muted">
        We'll text you a confirmation in seconds. Need to reschedule? Just reply.
      </p>
    </form>
  );
}
