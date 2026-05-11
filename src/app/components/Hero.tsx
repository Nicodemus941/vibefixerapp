import Image from "next/image";
import Link from "next/link";
import { IMG } from "../lib/images";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20">
      <Image
        src={IMG.heroBackdrop}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-10 object-cover opacity-[0.18]"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-black/85 to-[#0b0b0c]"
        aria-hidden
      />
      <div className="bg-grid absolute inset-0 -z-10 opacity-40" aria-hidden />
      <div
        className="absolute -top-32 -left-32 -z-10 h-[420px] w-[420px] rounded-full bg-[var(--gold)] opacity-[0.08] blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -right-20 -z-10 h-[420px] w-[420px] rounded-full bg-[var(--gold)] opacity-[0.06] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--gold)] opacity-75 live-dot" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--gold)]" />
              </span>
              Now accepting members · 3 spots left this month
            </div>

            <h1 className="mt-5 font-black uppercase leading-[0.92] tracking-tight text-[44px] sm:text-[64px] lg:text-[84px]">
              Your doctor.
              <br />
              On <span className="text-[var(--gold)]">your phone.</span>
              <br />
              <span className="text-stroke">7 days a week.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-white/80 sm:text-xl">
              Direct cell-phone access to a board-certified physician — not a
              nurse, not a chatbot, not a PA.{" "}
              <strong className="text-white">
                Dr. Monica &amp; Dr. Richard Sher
              </strong>{" "}
              treat you personally. Same-day visits. In-home when you need it.
              Central Florida’s most-loved concierge practice.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#book"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-7 py-4 text-base font-black uppercase tracking-wider text-black hover:bg-[var(--gold-bright)] transition shadow-[0_18px_60px_-20px_rgba(212,175,55,0.7)]"
              >
                Claim My Membership
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="tel:+14076637447"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-base font-bold uppercase tracking-wider text-white hover:border-[var(--gold)] hover:text-[var(--gold)] transition backdrop-blur"
              >
                Call (407) 663-7447
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/70">
              <Check>Board-certified MDs</Check>
              <Check>Month-to-month</Check>
              <Check>Cancel anytime</Check>
              <Check>No hidden fees</Check>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[var(--gold)]/30 via-transparent to-white/5 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur">
              <div className="relative h-44 sm:h-52 overflow-hidden">
                <Image
                  src={IMG.houseCall}
                  alt="A board-certified physician arriving for a house call"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-[#0b0b0c]" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-black/70 px-2.5 py-1 font-bold uppercase tracking-widest text-[var(--gold)]">
                    Quick Triage · 30 sec
                  </span>
                  <span className="rounded-full bg-[var(--gold)]/90 px-2.5 py-1 font-bold uppercase text-black">
                    Free
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <p className="text-xl font-bold leading-tight">
                  What brings you in today?
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Tell us in one tap. A real human follows up within 5 minutes
                  during business hours.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {[
                    { e: "🩺", l: "New patient" },
                    { e: "💊", l: "Refill / Rx" },
                    { e: "⚡", l: "Hormones" },
                    { e: "⚖️", l: "Weight loss" },
                    { e: "🧬", l: "Executive physical" },
                    { e: "💉", l: "Aesthetics" },
                  ].map((b) => (
                    <a
                      key={b.l}
                      href="#book"
                      className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm font-semibold hover:border-[var(--gold)]/60 hover:bg-[var(--gold)]/[0.06] transition"
                    >
                      <span className="text-lg">{b.e}</span>
                      <span>{b.l}</span>
                      <span className="ml-auto text-white/40 group-hover:text-[var(--gold)]">
                        →
                      </span>
                    </a>
                  ))}
                </div>

                <a
                  href="#book"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black py-3 text-sm font-bold hover:bg-[var(--gold-bright)] transition"
                >
                  Start Free Consult →
                </a>

                <div className="mt-4 flex items-center gap-3 text-[11px] text-white/55">
                  <Lock />
                  HIPAA-grade · Replies from a physician — never a bot.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--gold)]"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {children}
    </span>
  );
}

function Lock() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
