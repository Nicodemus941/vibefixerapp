"use client";

import { useActionState, useEffect, useState } from "react";
import { submitFastLead, type FastLeadState } from "../quote/actions";
import { BUSINESS } from "../config";
import { track } from "../lib/track";

const STORAGE_KEY = "fast.exit.shown";
const MIN_TIME_BEFORE_FIRE_MS = 30_000; // give them a chance to engage first
const MOBILE_DEEP_SCROLL_RATIO = 0.3;
const MOBILE_BACKSCROLL_PX = 200;

const initialState: FastLeadState = { ok: true };

// Exit-intent recovery modal. Fires once per session when the visitor is
// about to leave: cursor-leaves-top on desktop, deep-scroll-then-up on
// mobile. Suppressed for the first 30s so genuine fast-bouncers don't see
// it. Captures phone only — minimum friction, Eric gets a lead alert with
// "exit-intent" in the damage notes so he knows to be quick on callback.
export default function ExitIntentModal() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitFastLead, initialState);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* private browsing — fine, may show twice */
    }

    const startedAt = Date.now();
    let fired = false;

    const fire = (channel: string) => {
      if (fired) return;
      if (Date.now() - startedAt < MIN_TIME_BEFORE_FIRE_MS) return;
      fired = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      track("exit_intent_shown", { channel });
      setOpen(true);
    };

    // Desktop: cursor leaves through the top edge of the viewport.
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) fire("desktop");
    };

    // Mobile: deep-scrolled past 30%, then scrolled back up by 200+ px.
    let maxRatio = 0;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const ratio = window.scrollY / max;
      if (ratio > maxRatio) maxRatio = ratio;
      if (
        maxRatio > MOBILE_DEEP_SCROLL_RATIO &&
        (maxRatio - ratio) * max > MOBILE_BACKSCROLL_PX
      ) {
        fire("mobile_backscroll");
      }
    };

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Lock body scroll while modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const close = () => {
    track("exit_intent_dismissed");
    setOpen(false);
  };

  // After a successful submit, show a confirmation state instead of dismissing
  // immediately so the user knows their phone landed.
  const succeeded = !!state.done;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-pop">
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-ink/60 transition hover:bg-ink/20 hover:text-ink"
          aria-label="Dismiss"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z"
            />
          </svg>
        </button>

        <div className="bg-spotlight p-6 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
            One sec
          </span>
          <h2 className="headline mt-3 text-3xl font-extrabold sm:text-4xl">
            Don't drive on broken glass.
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Drop your phone. Eric will text you our soonest slot — no
            commitment. We come to your driveway.
          </p>
        </div>

        <div className="p-6">
          {succeeded ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center">
              <div className="text-2xl">✓</div>
              <div className="mt-1 text-base font-extrabold text-ink">
                Got it.
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                Eric or one of the boys will text you within minutes during
                business hours. No spam, ever.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-ink-soft"
              >
                Close
              </button>
            </div>
          ) : (
            <form action={action} className="space-y-3">
              <div
                aria-hidden="true"
                className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
              >
                <label>
                  Company (leave blank)
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-bold text-ink">Phone</span>
                <input
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(941) 555-0123"
                  className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
                />
                {state.errors?.phone ? (
                  <p className="mt-1 text-xs font-semibold text-flame">
                    {state.errors.phone}
                  </p>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-bold text-ink">
                  ZIP{" "}
                  <span className="font-normal text-ink-muted">
                    (optional — helps us route faster)
                  </span>
                </span>
                <input
                  name="zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="34287"
                  className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                onClick={() => track("exit_intent_submit_clicked")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-5 py-3.5 text-base font-extrabold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? "Sending..." : "Text me a slot →"}
              </button>
              <p className="text-center text-[11px] text-ink-muted">
                Or call now — {" "}
                <a
                  href={`tel:${BUSINESS.phoneDial}`}
                  className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4"
                >
                  {BUSINESS.phoneDisplay}
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
