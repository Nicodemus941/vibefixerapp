import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "../config";
import Logo from "../components/Logo";
import TrackOnMount from "../components/TrackOnMount";
import ShareReferral from "../components/ShareReferral";
import { normalizeCode } from "../lib/referral";

export const metadata: Metadata = {
  title: "Quote received — we'll be in touch",
  description: "Thanks for reaching out. We'll call or text shortly.",
};

type Props = { searchParams: Promise<{ code?: string }> };

export default async function ThankYouPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = normalizeCode(params.code ?? "");
  return (
    <div className="min-h-screen bg-spotlight text-white">
      <TrackOnMount event="lead_submitted" params={{ section: "quote" }} />
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Logo tone="paper" />
          <Link href="/" className="text-sm font-semibold text-white/75 hover:text-white">
            ← Back home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber text-ink shadow-pop">
          <svg viewBox="0 0 24 24" className="h-8 w-8">
            <path
              fill="currentColor"
              d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
            />
          </svg>
        </span>

        <h1 className="headline mt-6 text-4xl font-extrabold sm:text-6xl">
          Got it. <span className="underline-amber">We're on it.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/75">
          Your quote request just hit our phones. During business hours we typically
          reply within minutes — usually with an honest, flat answer in 5 minutes or less.
        </p>

        <div className="mt-10 grid w-full max-w-xl gap-3 text-left sm:grid-cols-2">
          <a
            href={`tel:${BUSINESS.phoneDial}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber px-6 py-4 text-base font-extrabold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z" />
            </svg>
            Call {BUSINESS.phoneDisplay}
          </a>
          <a
            href={`sms:${BUSINESS.phoneDial}?&body=${encodeURIComponent(BUSINESS.smsBody)}`}
            className="flex items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            Text us a photo
          </a>
        </div>

        <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-3">
          {[
            ["Avg reply", "< 10 min"],
            ["Most chip repairs", "same day"],
            ["Replacement", "next day"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber">{k}</div>
              <div className="mt-1 text-lg font-extrabold text-white">{v}</div>
            </div>
          ))}
        </div>

        {code ? <ShareReferral code={code} tone="dark" /> : null}

        <p className="mt-12 text-sm text-white/55">
          In the meantime — thank you for trusting a local family business.
        </p>
      </main>
    </div>
  );
}
