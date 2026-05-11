const TIERS = [
  {
    name: "Essential",
    tagline: "The waiting-room replacement.",
    price: 500,
    sub: "/ month · per adult",
    highlight: false,
    cta: "Start Essential",
    perks: [
      "Same-day appointments",
      "Direct phone access to your physician",
      "Unlimited sick visits",
      "Annual wellness exam",
      "Basic in-office labs",
      "Prescription refills",
      "Referrals & specialist coordination",
    ],
    notIncluded: ["In-home visits", "Executive physical", "Aesthetics credit"],
  },
  {
    name: "Signature",
    tagline: "Most-picked. Most loved.",
    price: 850,
    sub: "/ month · per adult",
    highlight: true,
    cta: "Become a Signature Member",
    perks: [
      "Everything in Essential, plus —",
      "In-home & office visits",
      "Telemedicine 7 days / week",
      "Functional medicine intake",
      "Hormone & metabolic workup",
      "$500 / yr aesthetics credit",
      "Travel medicine kit",
      "Priority same-hour callback",
    ],
    notIncluded: ["Executive physical day", "24/7 phone access"],
  },
  {
    name: "Black Card",
    tagline: "For the always-on.",
    price: 1500,
    sub: "/ month · per adult",
    highlight: false,
    cta: "Apply for Black Card",
    perks: [
      "Everything in Signature, plus —",
      "Full executive physical (half-day)",
      "24/7 direct cell to Dr. Sher",
      "On-call house calls (greater Orlando)",
      "Quarterly bloodwork & coaching",
      "Personalized longevity plan",
      "Concierge specialist coordination",
      "Travel telemedicine, worldwide",
    ],
    notIncluded: [],
  },
];

export default function Membership() {
  return (
    <section
      id="membership"
      className="relative py-20 sm:py-28 bg-gradient-to-b from-black via-black to-[#0d0c0a]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
            Membership
          </p>
          <h2 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            Three tiers.
            <br />
            <span className="text-[var(--gold)]">One promise:</span> we pick up.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/75">
            Month-to-month. No contracts. No hidden fees. Cancel any time
            without penalty. Membership covers your physician’s time —
            you’ll still want insurance for labs, imaging, and hospital stays.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl border p-7 ${
                t.highlight
                  ? "border-[var(--gold)]/60 bg-gradient-to-b from-[var(--gold)]/[0.12] via-black to-black shadow-[0_30px_80px_-30px_rgba(212,175,55,0.45)]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--gold)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                  Most Popular
                </span>
              )}

              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {t.name}
                </h3>
                {t.highlight && (
                  <span className="text-[10px] font-bold uppercase text-[var(--gold)]">
                    ★ Top tier
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/65">{t.tagline}</p>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-5xl font-black tracking-tight">
                  ${t.price}
                </span>
                <span className="pb-2 text-sm text-white/60">{t.sub}</span>
              </div>

              <a
                href="#book"
                className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black uppercase tracking-wider transition ${
                  t.highlight
                    ? "bg-[var(--gold)] text-black hover:bg-[var(--gold-bright)]"
                    : "border border-white/20 text-white hover:border-[var(--gold)] hover:text-[var(--gold)]"
                }`}
              >
                {t.cta} →
              </a>

              <ul className="mt-7 space-y-3 text-sm">
                {t.perks.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2.5 text-white/85"
                  >
                    <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--gold)]/15 text-[10px] text-[var(--gold)]">
                      ✓
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
                {t.notIncluded.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2.5 text-white/35"
                  >
                    <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/5 text-[10px]">
                      ✕
                    </span>
                    <span className="line-through">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-white/45">
          Couples & family pricing available — call{" "}
          <a
            className="underline hover:text-[var(--gold)]"
            href="tel:+14076637447"
          >
            (407) 663-7447
          </a>
          .
        </p>
      </div>
    </section>
  );
}
