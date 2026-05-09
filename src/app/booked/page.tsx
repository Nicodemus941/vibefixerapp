import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "../config";
import Logo from "../components/Logo";
import TrackOnMount from "../components/TrackOnMount";
import ShareReferral from "../components/ShareReferral";
import { buildBlockLookup, describeSlot, findSlot, generateDays } from "../lib/slots";
import { normalizeCode } from "../lib/referral";
import { listBlocks } from "../lib/store";

export const metadata: Metadata = {
  title: "Booked — see you soon",
  description:
    "You're locked in with F.A.S.T. Family Autoglass. Confirmation details below.",
};

export const dynamic = "force-dynamic";

function dayLabel(d: ReturnType<typeof describeSlot>): string {
  if (d.isToday) return `Today, ${d.weekdayLong}, ${d.monthDayLabel}`;
  if (d.isTomorrow) return `Tomorrow, ${d.weekdayLong}, ${d.monthDayLabel}`;
  return `${d.weekdayLong}, ${d.monthDayLabel}`;
}

type Props = { searchParams: Promise<{ slot?: string; code?: string }> };

export default async function BookedPage({ searchParams }: Props) {
  const params = await searchParams;
  const slotId = params.slot ?? "";
  const code = normalizeCode(params.code ?? "");
  const blocks = await listBlocks();
  const days = generateDays(new Date(), 7, buildBlockLookup(blocks));
  const slot = slotId ? findSlot(slotId, days) : null;
  const desc = slot ? describeSlot(slot) : null;

  return (
    <div className="min-h-screen bg-spotlight text-white">
      <TrackOnMount
        event="booking_completed"
        params={{
          section: "book",
          slot_id: slot?.id,
          slot_day: slot?.date,
        }}
      />
      <header className="absolute inset-x-0 top-0 z-10">
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
          You're <span className="underline-amber">locked in.</span>
        </h1>

        {desc && slot ? (
          <div className="mt-8 w-full max-w-md rounded-3xl border-2 border-amber/40 bg-white/[0.06] p-6 text-left">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
              Your install slot
            </div>
            <div className="mt-1 text-xl font-extrabold text-white">
              {dayLabel(desc)}
            </div>
            <div className="mt-1 text-3xl font-extrabold text-amber">
              {slot.rangeLabel}
            </div>
            <p className="mt-4 text-sm text-white/75">
              Eric will text you{" "}
              <span className="font-semibold text-white">about 30 minutes</span>{" "}
              before he heads your way. Need to reschedule? Just reply to that
              text.
            </p>
          </div>
        ) : (
          <p className="mt-6 max-w-xl text-lg text-white/75">
            Your booking is in. Eric will text or call within minutes to
            confirm details.
          </p>
        )}

        <div className="mt-10 grid w-full max-w-xl gap-3 text-left sm:grid-cols-2">
          <a
            href={`tel:${BUSINESS.phoneDial}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber px-6 py-4 text-base font-extrabold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z"
              />
            </svg>
            Call Eric · {BUSINESS.phoneDisplay}
          </a>
          <a
            href={`sms:${BUSINESS.phoneDial}?&body=${encodeURIComponent(
              "Hi Eric — I just booked a slot. Quick question: ",
            )}`}
            className="flex items-center justify-center rounded-2xl border border-white/25 bg-white/5 px-6 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            Text Eric a question
          </a>
        </div>

        <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-3">
          {[
            ["Confirmation", "by SMS in seconds"],
            ["Heads-up text", "~30 min before arrival"],
            ["Install time", "60–90 min · we come to you"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber">
                {k}
              </div>
              <div className="mt-1 text-sm font-extrabold text-white">{v}</div>
            </div>
          ))}
        </div>

        {code ? <ShareReferral code={code} tone="dark" /> : null}

        <p className="mt-12 text-sm text-white/55">
          Thank you for trusting a local family business.
        </p>
      </main>
    </div>
  );
}
