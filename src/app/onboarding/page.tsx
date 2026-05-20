"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
          {STEPS.map((s) => (
            <span
              key={s.n}
              className={
                s.n <= step
                  ? "text-neutral-900"
                  : "text-neutral-400"
              }
            >
              {s.n === step ? `Step ${s.n} of 3` : `${s.n}`}
              {s.n < 3 && <span className="mx-2 text-neutral-300">·</span>}
            </span>
          ))}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {current.title}
        </h1>
        <p className="mt-2 text-neutral-600">{current.desc}</p>
      </div>

      <div>
        {step === 1 && <ProfileStep value={profile} onChange={setProfile} />}
        {step === 2 && <OffersStep value={offers} onChange={setOffers} />}
        {step === 3 && <NeedsStep value={needs} onChange={setNeeds} />}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || pending}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance() || pending}
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
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
