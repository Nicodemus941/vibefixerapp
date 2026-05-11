const STEPS = [
  {
    n: "01",
    t: "Apply in 60 seconds",
    d: "Tell us about your health goals. We confirm fit and reserve your spot — same day.",
  },
  {
    n: "02",
    t: "Meet your doctor",
    d: "A 90-min onboarding visit (in-office or in-home). Full history, advanced labs, lifestyle deep-dive.",
  },
  {
    n: "03",
    t: "Build the plan",
    d: "Personalized roadmap: meds, hormones, weight, sleep, fitness, follow-ups. Sent to your phone.",
  },
  {
    n: "04",
    t: "Text. Call. Live.",
    d: "Your physician’s direct cell, 7 days a week. Same-day visits whenever life happens.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
            How it works
          </p>
          <h2 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            From applicant to
            <br />
            <span className="text-[var(--gold)]">patient — in a day.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <span className="text-5xl font-black text-[var(--gold)]/30">
                {s.n}
              </span>
              <h3 className="mt-3 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                {s.d}
              </p>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden lg:block absolute top-1/2 -right-3 text-2xl text-[var(--gold)]/40"
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
