"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileStep } from "./_steps/ProfileStep";
import { OffersStep, EMPTY_OFFER } from "./_steps/OffersStep";
import { NeedsStep, EMPTY_NEED } from "./_steps/NeedsStep";
import {
  completeOnboarding,
  type ProfilePayload,
  type OfferPayload,
  type NeedPayload,
} from "./actions";

const STEPS = [
  { n: 1, title: "Your profile", desc: "Tell us who you are." },
  { n: 2, title: "What you offer", desc: "List 1–3 things you can deliver." },
  {
    n: 3,
    title: "What you need",
    desc: "List 1–3 things you need. Reciprocity is required.",
  },
] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfilePayload>({
    display_name: "",
    company_name: "",
    company_url: "",
    industry: "",
    revenue_band: "",
  });
  const [offers, setOffers] = useState<OfferPayload[]>([{ ...EMPTY_OFFER }]);
  const [needs, setNeeds] = useState<NeedPayload[]>([{ ...EMPTY_NEED }]);

  function profileValid() {
    return (
      profile.display_name.trim().length > 0 &&
      profile.industry.trim().length > 0 &&
      profile.revenue_band.length > 0
    );
  }
  function offersValid() {
    return (
      offers.length >= 1 &&
      offers.length <= 3 &&
      offers.every(
        (o) =>
          o.title.trim() && o.description.trim() && o.category.trim() && o.pricing_model,
      )
    );
  }
  function needsValid() {
    return (
      needs.length >= 1 &&
      needs.length <= 3 &&
      needs.every(
        (n) =>
          n.title.trim() && n.description.trim() && n.category.trim() && n.urgency,
      )
    );
  }

  function canAdvance() {
    if (step === 1) return profileValid();
    if (step === 2) return offersValid();
    if (step === 3) return needsValid();
    return false;
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({ profile, offers, needs });
      if (result?.error) setError(result.error);
    });
  }

  const current = STEPS[step - 1];

  return (
    <div className="space-y-6">
      {/* Progress strip */}
      <ol className="flex items-center gap-2" aria-label="Onboarding progress">
        {STEPS.map((s) => {
          const done = s.n < step;
          const active = s.n === step;
          return (
            <li key={s.n} className="flex-1 flex items-center gap-2">
              <div
                className={[
                  "h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-mono tabular-nums transition-colors",
                  done
                    ? "bg-[var(--accent)] text-[var(--bg)]"
                    : active
                    ? "border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                    : "border border-[var(--border)] text-[var(--fg-subtle)] bg-[var(--surface-1)]",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : s.n}
              </div>
              {s.n < 3 && (
                <div
                  className={[
                    "flex-1 h-px transition-colors",
                    done ? "bg-[var(--accent)]" : "bg-[var(--border)]",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div>
        <p className="eyebrow mb-2">Step {step} of 3</p>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.03em] leading-tight break-words">
          {current.title}
        </h1>
        <p className="mt-2 text-[var(--fg-muted)] text-sm sm:text-base">{current.desc}</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 sm:p-6">
        {step === 1 && <ProfileStep value={profile} onChange={setProfile} />}
        {step === 2 && <OffersStep value={offers} onChange={setOffers} />}
        {step === 3 && <NeedsStep value={needs} onChange={setNeeds} />}
      </div>

      {error && (
        <div className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || pending}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance() || pending}
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canAdvance() || pending}
          >
            {pending ? "Setting up…" : "Finish & enter Loop"}
          </Button>
        )}
      </div>
    </div>
  );
}
