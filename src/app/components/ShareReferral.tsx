"use client";

import { useState } from "react";
import { REFERRAL_REWARD_USD } from "../lib/referral";
import { track } from "../lib/track";
import { BUSINESS } from "../config";

export default function ShareReferral({
  code,
  tone = "dark",
}: {
  code: string;
  tone?: "dark" | "light";
}) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const isDark = tone === "dark";
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${code}`
      : `https://www.fastfamilyautoglass.com/?ref=${code}`;
  const message = `Hey — used F.A.S.T. Family Autoglass for my windshield, totally worth it. They come to your driveway. If you book with my link we both get $${REFERRAL_REWARD_USD} off: ${url}`;

  const handleShare = async () => {
    track("referral_shared", { section: "post_booking", method: "navigator" });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: BUSINESS.name,
          text: message,
        });
        return;
      } catch {
        /* user dismissed; fall through to clipboard */
      }
    }
    await handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      track("referral_copied", { section: "post_booking" });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — leave the URL on screen so user can copy manually */
    }
  };

  return (
    <div
      className={`mt-10 w-full max-w-xl rounded-3xl border-2 p-6 text-left ${
        isDark
          ? "border-amber/40 bg-white/[0.06] text-white"
          : "border-amber/40 bg-amber/10 text-ink"
      }`}
    >
      <div
        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
          isDark ? "text-amber" : "text-amber-bold"
        }`}
      >
        Share &amp; earn ${REFERRAL_REWARD_USD}
      </div>
      <h3
        className={`mt-1 text-lg font-extrabold ${
          isDark ? "text-white" : "text-ink"
        }`}
      >
        Refer a friend, both save ${REFERRAL_REWARD_USD}.
      </h3>
      <p
        className={`mt-1 text-sm ${
          isDark ? "text-white/75" : "text-ink-muted"
        }`}
      >
        Send your code to someone with a cracked windshield. They get $
        {REFERRAL_REWARD_USD} off, you get $
        {REFERRAL_REWARD_USD} off your next install.
      </p>

      <div
        className={`mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${
          isDark
            ? "border border-white/15 bg-white/[0.06]"
            : "border border-line bg-white"
        }`}
      >
        <div>
          <div
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isDark ? "text-white/55" : "text-ink-muted"
            }`}
          >
            Your code
          </div>
          <div
            className={`mt-0.5 text-2xl font-extrabold tracking-[0.18em] ${
              isDark ? "text-amber" : "text-amber-bold"
            }`}
          >
            {code}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber px-4 py-2.5 text-sm font-extrabold text-ink shadow-pop transition hover:bg-amber-bold"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 1 0-3-3c0 .24.04.47.09.7L8.04 9.81A2.99 2.99 0 0 0 6 9a3 3 0 1 0 0 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.92 2.92 0 1 0 2.92-2.92Z"
              />
            </svg>
            Share
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              isDark
                ? "border-white/25 bg-white/5 text-white hover:bg-white/10"
                : "border-line bg-white text-ink hover:border-amber hover:bg-amber/5"
            }`}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
