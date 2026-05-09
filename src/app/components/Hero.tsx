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
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/90">
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
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
              Mobile · {BUSINESS.city}
            </span>

            <h1 className="headline mt-5 text-[40px] font-extrabold text-balance sm:text-6xl lg:text-[72px]">
              Cracked windshield?
              <br className="hidden sm:block" />
              We come to your driveway.
              <br className="hidden sm:block" />
              <span className="underline-amber">$0 with insurance.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
              Family-owned mobile auto glass in {BUSINESS.city}.
              Same-day chip repairs. Next-day windshield replacement when you
              call before <span className="font-bold text-white">{BUSINESS.cutoffTime}</span>.
              We file your insurance claim — you don't lift a finger.
            </p>

            {/* Single dominant CTA — Hormozi-style */}
            <div className="mt-8">
              <a
                href={`tel:${BUSINESS.phoneDial}`}
                className="group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-amber px-7 py-5 text-lg font-extrabold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold sm:w-auto sm:text-xl"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z" />
                </svg>
                Call Eric — {BUSINESS.phoneDisplay}
              </a>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
                <a
                  href="/quote"
                  className="font-semibold text-white underline decoration-amber decoration-2 underline-offset-4 hover:decoration-4"
                >
                  Or get a free quote online →
                </a>
                <span className="hidden sm:inline">·</span>
                <a
                  href={`sms:${BUSINESS.phoneDial}?&body=${encodeURIComponent(BUSINESS.smsBody)}`}
                  className="font-semibold text-white underline decoration-amber/60 decoration-2 underline-offset-4 hover:decoration-4"
                >
                  Or text us a photo
                </a>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-full bg-white/8 px-3 py-1.5">
                <StarRow />
                <span className="text-xs font-medium text-white/85">5.0 from real customers</span>
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
                label={`${BUSINESS.yearsExperience}+ yrs · family-owned`}
              />
            </div>
          </div>

          {/* Hero card — solid (no glassmorphism), high contrast */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border-2 border-amber/40 bg-white p-1.5 shadow-pop">
              <div className="rounded-[20px] bg-bone p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-bold">
                    Why call us first
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Booking now
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line bg-white p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Chip repairs</div>
                    <div className="mt-1 text-2xl font-extrabold text-ink">Same day</div>
                  </div>
                  <div className="rounded-xl border border-line bg-white p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Replacement</div>
                    <div className="mt-1 text-2xl font-extrabold text-ink">Next day</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    ["We come to your driveway", "no shop trips"],
                    ["We file your insurance claim", "you don't lift a finger"],
                    ["After-hours, weekends, on-site", "your schedule, not ours"],
                    [`Call by ${BUSINESS.cutoffTime} = next-day install`, "from the actual business"],
                  ].map(([title, sub]) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-lg border border-line bg-white px-3 py-2.5"
                    >
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-amber-bold">
                        <path
                          fill="currentColor"
                          d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                        />
                      </svg>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-ink">{title}</div>
                        <div className="text-xs text-ink-muted">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl bg-ink p-4 text-white">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                    What it costs
                  </div>
                  <div className="mt-1 text-lg font-extrabold">
                    $0 with most comprehensive insurance.
                  </div>
                  <div className="text-xs text-white/65">
                    Cash quotes are honest, flat, and transparent — call for today's price.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative -mb-px">
        <svg viewBox="0 0 1440 64" className="block w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0v40c240 32 480 32 720 16s480-48 720-32v40H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
