"use client";

import { useState } from "react";
import { BUSINESS } from "../config";

const FAQS = [
  {
    q: "How fast can you actually get to me?",
    a: `Most chip and crack repairs same day. For a full windshield replacement, call before ${BUSINESS.cutoffTime} and we'll be there next day — often sooner.`,
  },
  {
    q: "Will my insurance cover the windshield?",
    a: "If you have comprehensive coverage in Florida, almost always — usually with no deductible on a windshield. We file the claim for you and tell you the answer in under 5 minutes.",
  },
  {
    q: "Do you really come to my home or work?",
    a: "Yes — that's the whole point. Driveway, parking lot, office garage. As long as we have safe space to work, we'll be there.",
  },
  {
    q: "Do you work nights and weekends?",
    a: "We do. We work around YOUR schedule — including evenings and weekends. Just call or text and we'll find a slot.",
  },
  {
    q: "What areas do you serve?",
    a: BUSINESS.serviceArea + ". Outside that range? Call us — if it makes sense, we'll come.",
  },
  {
    q: "How long does a full replacement take?",
    a: "60–90 minutes of install time, plus a safe-drive-away time so the urethane bond cures. We tell you exactly when you can drive.",
  },
  {
    q: "What kind of glass do you use?",
    a: "OEM-quality glass that matches manufacturer spec — including ADAS-compatible windshields when needed. We don't cut corners on safety.",
  },
  {
    q: "Can I just pay cash?",
    a: "Absolutely. We give honest, flat cash quotes — usually well below dealer pricing. Just call or use the quote form.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative bg-bone py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-bold">
            Frequently asked
          </span>
          <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
            Got <span className="underline-amber">questions?</span>
          </h2>
          <p className="mt-4 text-ink-muted">
            Real answers — the same ones we'd give a neighbor.
          </p>
        </div>

        <div className="mt-12 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-bone"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] font-bold sm:text-base">{f.q}</span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-amber transition ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                      <path fill="currentColor" d="m7 10 5 5 5-5H7Z" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`grid overflow-hidden px-6 transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0">
                    <p className="text-sm leading-relaxed text-ink-muted">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-ink-muted">
            Still have a question?{" "}
            <a
              href={`tel:${BUSINESS.phoneDial}`}
              className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4"
            >
              Call {BUSINESS.phoneDisplay}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
