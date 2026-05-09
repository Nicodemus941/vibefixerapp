import { BUSINESS } from "../config";
import Header from "./Header";

function StarRow() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Five star rating">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 text-amber drop-shadow">
          <path
            fill="currentColor"
            d="m12 17.27 5.18 3.14-1.37-5.88L20.5 9.6l-6.04-.51L12 3.5 9.54 9.09l-6.04.51 4.69 4.93-1.37 5.88L12 17.27Z"
          />
        </svg>
      ))}
    </div>
  );
}

function TrustChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm">
      <span className="text-amber">{icon}</span>
      {label}
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-spotlight text-white">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <Header />

      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-36 lg:pb-36 lg:pt-44">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber">
              <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
              Mobile · {BUSINESS.city}
            </span>

            <h1 className="headline mt-5 text-[42px] font-extrabold sm:text-6xl lg:text-[74px]">
              Your driveway.
              <br className="hidden sm:block" />
              <span className="text-white"> Our tools. </span>
              <span className="underline-amber">A brand-new windshield by tomorrow.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/75 sm:text-xl">
              Family-owned mobile auto glass with {BUSINESS.yearsExperience}+ years of experience.
              We come to <em className="not-italic font-semibold text-white">you</em> — same-day repairs,
              next-day replacements, and we work around <em className="not-italic font-semibold text-white">your</em> schedule.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/quote"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-amber px-6 py-4 text-[15px] font-bold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold sm:text-base"
              >
                Get my free quote
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-0.5">
                  <path fill="currentColor" d="M5 12h13l-4.3-4.3 1.4-1.4 6.7 6.7-6.7 6.7-1.4-1.4 4.3-4.3H5v-2Z" />
                </svg>
              </a>
              <a
                href={`tel:${BUSINESS.phoneDial}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-6 py-4 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:text-base"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z" />
                </svg>
                Call {BUSINESS.phoneDisplay}
              </a>
            </div>

            <p className="mt-4 text-sm text-white/55">
              <span className="font-semibold text-amber">Call before {BUSINESS.cutoffTime}</span>{" "}
              for next-day windshield replacement. Most repairs same day.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-full bg-white/5 px-3 py-1.5">
                <StarRow />
                <span className="text-xs font-medium text-white/80">5.0 · trusted by North Port families</span>
              </div>
              <TrustChip
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" />
                  </svg>
                }
                label="Insurance approved"
              />
              <TrustChip
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path fill="currentColor" d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0Zm10-5h-2v6l5 3 1-1.7-4-2.4V7Z" />
                  </svg>
                }
                label="Nights & weekends"
              />
              <TrustChip
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path fill="currentColor" d="M12 2 3 6v6c0 5 3.5 9.3 9 10 5.5-.7 9-5 9-10V6l-9-4Z" />
                  </svg>
                }
                label={`${BUSINESS.yearsExperience}+ yrs experience`}
              />
            </div>
          </div>

          {/* Hero card: snapshot + value stack */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md">
              <div className="rounded-[20px] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                    Today's snapshot
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Booking now
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Mobile slots left</div>
                    <div className="mt-1 text-2xl font-extrabold text-white">3 today</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Avg arrival</div>
                    <div className="mt-1 text-2xl font-extrabold text-white">&lt; 90 min</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 text-sm text-white/85">
                  {[
                    ["We come to your driveway", "no shop trips"],
                    ["We handle your insurance claim", "you don't lift a finger"],
                    ["Same-day chip & crack repair", "stop the spread today"],
                    ["Next-day full replacement", `call by ${BUSINESS.cutoffTime}`],
                  ].map(([title, sub]) => (
                    <div key={title} className="flex items-start gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-amber">
                        <path
                          fill="currentColor"
                          d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                        />
                      </svg>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{title}</div>
                        <div className="text-xs text-white/55">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-amber/30 bg-amber/10 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                    What it costs
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">
                    $0 with most comprehensive insurance
                  </div>
                  <div className="text-xs text-white/65">
                    Cash quotes — no shop markup. No surprise fees.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* curve to next section */}
      <div className="relative -mb-px">
        <svg viewBox="0 0 1440 64" className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0v40c240 32 480 32 720 16s480-48 720-32v40H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
