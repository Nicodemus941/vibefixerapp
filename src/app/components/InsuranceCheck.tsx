"use client";

import { useMemo, useState } from "react";
import {
  answerFor,
  COVERAGE_OPTIONS,
  STATES,
  type Coverage,
} from "../lib/insurance";

const VERDICT_BADGE: Record<
  ReturnType<typeof answerFor>["verdict"],
  { label: string; bg: string; text: string }
> = {
  "free-with-insurance": {
    label: "Best case",
    bg: "bg-emerald-500",
    text: "text-white",
  },
  "deductible-likely": {
    label: "Covered with deductible",
    bg: "bg-amber",
    text: "text-ink",
  },
  "we-check": {
    label: "We'll verify",
    bg: "bg-brand",
    text: "text-white",
  },
  "cash-only": {
    label: "Cash quote",
    bg: "bg-flame",
    text: "text-white",
  },
};

export default function InsuranceCheck() {
  const [stateCode, setStateCode] = useState<string>("FL");
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const answer = useMemo(
    () => (coverage ? answerFor(stateCode, coverage) : null),
    [stateCode, coverage],
  );

  const badge = answer ? VERDICT_BADGE[answer.verdict] : null;

  return (
    <section className="relative bg-bone py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-end gap-6 sm:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
              Insurance pre-check · 10 seconds
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              Will my insurance{" "}
              <span className="underline-amber">cover this?</span>
            </h2>
            <p className="mt-4 max-w-md text-ink-muted">
              Answer two quick questions. We'll tell you what to expect — and
              whether you'll pay anything out-of-pocket.
            </p>
          </div>
          <div className="hidden justify-self-end sm:block">
            <div className="rounded-2xl border border-line bg-white p-5 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
                The Florida advantage
              </div>
              <p className="mt-2 text-ink">
                FL Statute 627.7288 means comprehensive policies cover
                windshield work with{" "}
                <span className="font-bold">no deductible</span>. Most
                neighbors don't realize this.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Inputs */}
          <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8 lg:col-span-7">
            <div>
              <div className="text-sm font-bold text-ink">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber text-xs">
                  1
                </span>
                Where do you live?
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STATES.map((s) => (
                  <label
                    key={s.code}
                    className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      stateCode === s.code
                        ? "border-amber bg-amber/15 text-ink"
                        : "border-line bg-bone text-ink hover:border-amber"
                    }`}
                  >
                    <input
                      type="radio"
                      name="state"
                      value={s.code}
                      checked={stateCode === s.code}
                      onChange={() => setStateCode(s.code)}
                      className="sr-only"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <div className="text-sm font-bold text-ink">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber text-xs">
                  2
                </span>
                Do you have comprehensive coverage?
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {COVERAGE_OPTIONS.map((c) => (
                  <label
                    key={c.value}
                    className={`flex cursor-pointer flex-col items-start rounded-xl border p-4 text-sm transition ${
                      coverage === c.value
                        ? "border-amber bg-amber/10 ring-2 ring-amber"
                        : "border-line bg-bone hover:border-amber"
                    }`}
                  >
                    <input
                      type="radio"
                      name="coverage"
                      value={c.value}
                      checked={coverage === c.value}
                      onChange={() => setCoverage(c.value)}
                      className="sr-only"
                    />
                    <span className="font-bold text-ink">{c.label}</span>
                    <span className="mt-1 text-xs text-ink-muted">{c.sub}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                Not sure what you have? Pick "Not sure" — we'll verify with
                your carrier in under 5 minutes.
              </p>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-5">
            {answer && badge ? (
              <div className="overflow-hidden rounded-3xl border-2 border-amber bg-white shadow-pop">
                <div className={`${badge.bg} ${badge.text} p-6`}>
                  <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                    {badge.label}
                  </span>
                  <div className="mt-2 text-3xl font-extrabold tracking-tight">
                    {answer.highlight}
                  </div>
                  <div className="mt-1 text-sm font-semibold opacity-90">
                    {answer.headline}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-ink">{answer.body}</p>
                  <a
                    href={answer.cta.primary.href}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-ink-soft"
                  >
                    {answer.cta.primary.label}
                  </a>
                  {answer.cta.secondary ? (
                    <a
                      href={answer.cta.secondary.href}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-amber hover:bg-amber/5"
                    >
                      {answer.cta.secondary.label}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line bg-white p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/15 text-amber-bold">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    <path
                      fill="currentColor"
                      d="M11 7h2v2h-2zM11 11h2v6h-2z M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                    />
                  </svg>
                </span>
                <div className="mt-4 text-sm font-bold text-ink">
                  Pick your coverage type to see your result
                </div>
                <p className="mt-1 max-w-xs text-xs text-ink-muted">
                  We'll show you whether you'll pay $0, a deductible, or a flat
                  cash price — and what to do next.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          General guidance only. Final coverage depends on your specific policy
          — we'll confirm with your carrier before any work begins.
        </p>
      </div>
    </section>
  );
}
