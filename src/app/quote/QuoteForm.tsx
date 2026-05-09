"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { submitQuote, type QuoteState } from "./actions";

const initialState: QuoteState = { ok: true };

const SERVICES = [
  { value: "chip-repair", label: "Rock chip / small crack" },
  { value: "windshield-replace", label: "Windshield replacement" },
  { value: "side-back", label: "Side, vent, or rear glass" },
  { value: "not-sure", label: "Not sure — please advise" },
];

const VALID_SERVICES = new Set(SERVICES.map((s) => s.value));

function field(label: string, sub?: string) {
  return (
    <div className="mb-1">
      <label className="text-sm font-bold text-ink">{label}</label>
      {sub ? <span className="ml-1 text-xs font-medium text-ink-muted">{sub}</span> : null}
    </div>
  );
}

export default function QuoteForm() {
  const [state, action, pending] = useActionState(submitQuote, initialState);
  const params = useSearchParams();

  const presetYear = params.get("year")?.trim() ?? "";
  const presetMake = params.get("make")?.trim() ?? "";
  const presetModel = params.get("model")?.trim() ?? "";
  const presetVehicle =
    [presetYear, presetMake, presetModel].filter(Boolean).join(" ").trim();
  const presetServiceParam = params.get("service")?.trim() ?? "";
  const presetService = VALID_SERVICES.has(presetServiceParam)
    ? presetServiceParam
    : "";

  return (
    <form action={action} className="space-y-5">
      {/* Honeypot — hidden from sighted users, bots fill it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
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
      <div>
        {field("Your name", "(so we know who to ask for)")}
        <input
          name="name"
          required
          autoComplete="name"
          placeholder="Jane Smith"
          className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none ring-amber/0 transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
        />
        {state.errors?.name ? (
          <p className="mt-1 text-xs font-semibold text-flame">{state.errors.name}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          {field("Phone", "(we'll call/text — no spam)")}
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
          {field("ZIP", "(optional)")}
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
        {field("Vehicle", "(year, make, model)")}
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
        {field("What do you need?")}
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          {field("Insurance", "(optional)")}
          <input
            name="insurance"
            placeholder="GEICO / Progressive / cash"
            className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
          />
        </div>
        <div>
          {field("Damage", "(short description)")}
          <input
            name="damage"
            placeholder="Chip on driver side, no crack yet"
            className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber px-6 py-4 text-base font-extrabold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Sending..." : "Get my free quote"}
        {!pending && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-0.5">
            <path fill="currentColor" d="M5 12h13l-4.3-4.3 1.4-1.4 6.7 6.7-6.7 6.7-1.4-1.4 4.3-4.3H5v-2Z" />
          </svg>
        )}
      </button>

      <p className="text-center text-xs text-ink-muted">
        We'll call or text within minutes during business hours. No spam. Ever.
      </p>
    </form>
  );
}
