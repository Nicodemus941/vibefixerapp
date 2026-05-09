import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "../config";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import QuoteForm from "./QuoteForm";

export const metadata: Metadata = {
  title: "Get a free quote",
  description:
    "Tell us about your vehicle and we'll text or call you with a free, honest quote — usually within minutes during business hours.",
};

const TRUST = [
  "We come to you",
  "We file your insurance claim",
  "Same-day chip & crack repair",
  "Next-day full replacement",
  "Honest cash quotes — no markup",
  "Family-owned · 15+ years",
];

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-bone">
      <header className="bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Logo tone="paper" />
          <Link
            href="/"
            className="text-sm font-semibold text-white/75 hover:text-white"
          >
            ← Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-bold">
              60-second free quote
            </span>
            <h1 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              Tell us what's broken.{" "}
              <span className="underline-amber">We'll handle the rest.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted">
              Drop your details below. We'll call or text within minutes during business hours
              with an honest answer — insurance or cash.
            </p>

            <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
              <QuoteForm />
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-white p-5 text-sm text-ink-muted">
              Prefer to talk now?{" "}
              <a
                href={`tel:${BUSINESS.phoneDial}`}
                className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4"
              >
                Call {BUSINESS.phoneDisplay}
              </a>{" "}
              or{" "}
              <a
                href={`sms:${BUSINESS.phoneDial}?&body=${encodeURIComponent(BUSINESS.smsBody)}`}
                className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4"
              >
                text us
              </a>
              .
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-6 space-y-6">
              <div className="rounded-3xl border border-amber/30 bg-amber/10 p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-bold">
                  What you get
                </div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {TRUST.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-ink">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-amber-bold">
                        <path
                          fill="currentColor"
                          d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                        />
                      </svg>
                      <span className="font-medium">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="overflow-hidden rounded-3xl bg-ink p-6 text-white">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                  Speed promise
                </div>
                <p className="mt-3 text-xl font-extrabold leading-tight">
                  Call before {BUSINESS.cutoffTime} for next-day windshield install.
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Most chip and crack repairs done <span className="font-semibold text-white">same day</span>.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
