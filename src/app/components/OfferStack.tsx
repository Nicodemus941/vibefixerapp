import { BUSINESS } from "../config";

const STACK = [
  "A licensed mobile tech at YOUR location — not a shop",
  "Your insurance claim filed for you — start to finish",
  "Same-day rock chip and crack repair",
  `Next-day full windshield replacement (call by ${BUSINESS.cutoffTime})`,
  "OEM-quality glass + proper urethane bond, every time",
  "After-hours, weekend, and on-site appointments",
  "Honest answers — and we pick up the phone",
];

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
                What it costs
              </div>
              <div className="mt-1 text-3xl font-extrabold text-ink">
                $0 with most insurance.
              </div>
              <div className="mt-1 text-sm text-ink-muted">
                Cash quotes are honest, flat-rate, and usually a fraction of dealer pricing.
              </div>
              <a
                href={`tel:${BUSINESS.phoneDial}`}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-soft"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z" />
                </svg>
                Call Eric — {BUSINESS.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-line bg-bone shadow-card">
              <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                  The F.A.S.T. value stack
                </div>
                <div className="text-xs font-semibold text-amber-bold">all included</div>
              </div>
              <ul className="divide-y divide-line">
                {STACK.map((item) => (
                  <li
                    key={item}
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
                      <span className="text-[15px] font-medium text-ink">{item}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-bold">
                      Included
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-4 bg-ink px-6 py-5 text-white">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                    Bottom line
                  </div>
                  <div className="text-xl font-extrabold">All of it. One call.</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                    Your cost
                  </div>
                  <div className="text-2xl font-extrabold">$0 with insurance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
