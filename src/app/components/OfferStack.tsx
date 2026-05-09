import { BUSINESS } from "../config";

const STACK = [
  { item: "Licensed mobile tech at YOUR location", value: 120 },
  { item: "We file your insurance claim for you", value: 150 },
  { item: "Same-day chip & crack repair", value: 250 },
  { item: `Next-day replacement (call by ${BUSINESS.cutoffTime})`, value: 200 },
  { item: "OEM-quality glass + proper urethane bond", value: 300 },
  { item: "After-hours, weekend, and on-site service", value: 150 },
  { item: "No waiting room. No shop trips.", value: 100 },
];

const TOTAL = STACK.reduce((s, x) => s + x.value, 0);

export default function OfferStack() {
  return (
    <section className="relative bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-bold">
              What you actually get
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              Everything that comes with{" "}
              <span className="underline-amber">one phone call.</span>
            </h2>
            <p className="mt-5 text-lg text-ink-muted">
              Most shops bill you for the install and call it a day. We bake the
              full experience in — the mobile visit, the insurance work, the
              flexibility, the family treatment.
            </p>

            <div className="mt-8 rounded-2xl border-2 border-amber bg-amber/10 p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-bold">
                Bottom line
              </div>
              <div className="mt-1 text-3xl font-extrabold text-ink">
                $0 with most insurance.
              </div>
              <div className="mt-1 text-sm text-ink-muted">
                Cash quotes are honest, flat-rate, and usually a fraction of dealer pricing.
              </div>
              <a
                href="/quote"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-soft"
              >
                Get my free quote
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M5 12h13l-4.3-4.3 1.4-1.4 6.7 6.7-6.7 6.7-1.4-1.4 4.3-4.3H5v-2Z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-line bg-bone shadow-card">
              <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                  The F.A.S.T. value stack
                </div>
                <div className="text-xs text-ink-muted">est. retail value</div>
              </div>
              <ul className="divide-y divide-line">
                {STACK.map((row) => (
                  <li
                    key={row.item}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-amber">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                          <path
                            fill="currentColor"
                            d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                          />
                        </svg>
                      </span>
                      <span className="text-[15px] font-medium text-ink">{row.item}</span>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-ink-muted line-through">
                      ${row.value}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-4 bg-ink px-6 py-5 text-white">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                    Total value
                  </div>
                  <div className="text-2xl font-extrabold">${TOTAL.toLocaleString()}+</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                    Your cost with insurance
                  </div>
                  <div className="text-2xl font-extrabold">$0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
