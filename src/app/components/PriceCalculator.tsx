"use client";

import { useMemo, useState } from "react";
import {
  estimate,
  getCategory,
  getMakes,
  getModels,
  SERVICE_META,
  type Service,
  YEARS,
} from "../lib/pricing";
import { BUSINESS } from "../config";

const SERVICE_OPTIONS: Service[] = [
  "windshield-replace",
  "chip-repair",
  "side-back",
];

function selectClasses() {
  return "block w-full appearance-none rounded-xl border border-line bg-white px-4 py-3 pr-10 text-base font-medium text-ink outline-none transition focus:border-amber focus:ring-4 focus:ring-amber/20";
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
      aria-hidden="true"
    >
      <path fill="currentColor" d="m7 10 5 5 5-5H7Z" />
    </svg>
  );
}

export default function PriceCalculator() {
  const makes = getMakes();
  const [year, setYear] = useState<number>(YEARS[1] ?? new Date().getFullYear());
  const [make, setMake] = useState<string>("Toyota");
  const [model, setModel] = useState<string>("RAV4");
  const [service, setService] = useState<Service>("windshield-replace");

  const models = useMemo(() => getModels(make), [make]);
  // If the make changes and the previously selected model isn't valid anymore,
  // snap to the first model.
  const safeModel = models.includes(model) ? model : models[0] ?? "";
  const result = useMemo(() => {
    const category = getCategory(make, safeModel);
    return estimate(year, category, service);
  }, [year, make, safeModel, service]);

  const lockHref = `/book?year=${year}&make=${encodeURIComponent(
    make,
  )}&model=${encodeURIComponent(safeModel)}&service=${service}`;

  return (
    <section id="price" className="relative bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
              Cash pricing — no surprises
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              Get your cash price{" "}
              <span className="underline-amber">right now.</span>
            </h2>
            <p className="mt-4 text-ink-muted">
              Pick your vehicle. We'll show you the typical cash range for our
              area — no calling, no waiting, no salesy markup.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="rounded-2xl border border-line bg-bone p-5 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
                The promise
              </div>
              <p className="mt-2 text-ink">
                Estimates below are honest typical ranges. Your{" "}
                <span className="font-bold">final price is confirmed in person</span>{" "}
                before any work begins.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Inputs */}
          <div className="rounded-3xl border border-line bg-bone p-6 shadow-card sm:p-8 lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="calc-year"
                  className="block text-sm font-bold text-ink"
                >
                  Year
                </label>
                <div className="relative mt-1">
                  <select
                    id="calc-year"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className={selectClasses()}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>
              <div>
                <label
                  htmlFor="calc-make"
                  className="block text-sm font-bold text-ink"
                >
                  Make
                </label>
                <div className="relative mt-1">
                  <select
                    id="calc-make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className={selectClasses()}
                  >
                    {makes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="calc-model"
                  className="block text-sm font-bold text-ink"
                >
                  Model
                </label>
                <div className="relative mt-1">
                  <select
                    id="calc-model"
                    value={safeModel}
                    onChange={(e) => setModel(e.target.value)}
                    className={selectClasses()}
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">
                  Don't see your model?{" "}
                  <a
                    href={`tel:${BUSINESS.phoneDial}`}
                    className="font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4"
                  >
                    Call Eric — we cover it.
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-bold text-ink">Service</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {SERVICE_OPTIONS.map((s) => (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      service === s
                        ? "border-amber bg-amber/10"
                        : "border-line bg-white hover:border-amber"
                    }`}
                  >
                    <input
                      type="radio"
                      name="calc-service"
                      value={s}
                      checked={service === s}
                      onChange={() => setService(s)}
                      className="h-4 w-4 accent-amber"
                    />
                    {SERVICE_META[s].short}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border-2 border-amber bg-white shadow-pop">
              <div className="bg-amber p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/70">
                  Your estimated cash range
                </div>
                <div className="mt-1 flex items-baseline gap-2 text-ink">
                  <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                    ${result.range[0]}
                  </span>
                  <span className="text-2xl font-bold opacity-60">–</span>
                  <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                    ${result.range[1]}
                  </span>
                </div>
                <div className="mt-1 text-sm font-semibold text-ink/80">
                  for a {year} {make} {safeModel} · {SERVICE_META[service].short}
                </div>
              </div>

              <div className="space-y-3 p-6">
                <div className="flex items-start gap-3 rounded-xl bg-brand-soft/60 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-deep text-white">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                      <path
                        fill="currentColor"
                        d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                      />
                    </svg>
                  </span>
                  <div className="text-sm">
                    <div className="font-bold text-ink">With insurance</div>
                    <div className="text-ink-muted">{result.insuredText}</div>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-ink-muted">
                  {result.factors.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-bold"
                      >
                        <path
                          fill="currentColor"
                          d="M11 7h2v6h-2zM12 17.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"
                        />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={lockHref}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-ink-soft"
                >
                  Lock in this price →
                </a>
                <a
                  href={`tel:${BUSINESS.phoneDial}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-amber hover:bg-amber/5"
                >
                  Or call Eric · {BUSINESS.phoneDisplay}
                </a>
              </div>
            </div>

            <p className="mt-3 px-1 text-xs text-ink-muted">
              Estimate based on typical Florida-market mobile installs. Final
              price confirmed before any work begins. No surprise fees, ever.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
