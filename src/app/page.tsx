export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <Hero />
      <Broken />
      <HowItWorks />
      <WhatYouGet />
      <Guarantee />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 max-w-5xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600 mb-8">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Founding Cohort — 500 spots left
      </div>
      <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.05]">
        Stop networking.
        <br />
        <span className="text-neutral-500">Start building.</span>
      </h1>
      <p className="mt-6 text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
        The first platform where every founder must give AND receive. AI matches
        your needs to another founder&apos;s services in under 24 hours.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="#claim"
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Claim Your Spot — Free
        </a>
        <a
          href="#how"
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          See How It Works ↓
        </a>
      </div>
    </section>
  );
}

function Broken() {
  const items = [
    'Another connection request from a "growth hacker"',
    "A feed of motivational posts from people who've never shipped",
    "To pay $99/mo to InMail people who'll never reply",
  ];
  return (
    <section className="px-6 py-20 border-t border-neutral-100 bg-neutral-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          LinkedIn is broken for founders.
        </h2>
        <p className="mt-4 text-neutral-600">You don&apos;t need:</p>
        <ul className="mt-6 space-y-3">
          {items.map((t) => (
            <li
              key={t}
              className="flex items-start gap-3 text-neutral-700"
            >
              <span className="mt-1 text-red-500" aria-hidden>
                ✕
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-lg font-medium text-neutral-900">
          You need: the right person, with the right skill, ready to start
          today.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "List what you sell.",
      body: "Web design? Cold email? Fractional CFO? Anything.",
    },
    {
      n: "2",
      title: "List what you need.",
      body: "Required — no spectators allowed.",
    },
    {
      n: "3",
      title: "Wake up to 3 matches every morning.",
      body: "Hire on the spot, or build the relationship first. Your call.",
    },
  ];
  return (
    <section id="how" className="px-6 py-24 max-w-5xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
        How Loop Works
      </h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-neutral-200 p-6"
          >
            <div className="h-9 w-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
              {s.n}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              {s.body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-neutral-500">
        That&apos;s it. No feed. No likes. No theater.
      </p>
    </section>
  );
}

function WhatYouGet() {
  const perks = [
    {
      title: "AI-matched introductions every 24 hours",
      value: "$2,000/mo value",
    },
    {
      title: "Founder-only network (verified revenue, no recruiters)",
      value: "$500/mo value",
    },
    {
      title: "Escrow-protected contracts (we hold funds until delivery)",
      value: "$300/mo value",
    },
    {
      title: "Auto-drafted warm intros (Claude writes the opener)",
      value: "$200/mo value",
    },
    {
      title: "Outcome-based reputation score (receipts, not endorsements)",
      value: "priceless",
    },
  ];
  return (
    <section className="px-6 py-24 bg-neutral-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          What You Get <span className="text-neutral-400">(Free)</span>
        </h2>
        <ul className="mt-10 space-y-4">
          {perks.map((p) => (
            <li
              key={p.title}
              className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 text-emerald-400" aria-hidden>
                  ✓
                </span>
                <span className="text-neutral-100">{p.title}</span>
              </div>
              <span className="shrink-0 text-sm text-neutral-400 italic">
                {p.value}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
          <p className="text-lg">
            Total value:{" "}
            <span className="font-semibold">$3,000+/month</span>. Your price:{" "}
            <span className="font-semibold">$0</span> — as long as you
            reciprocate.
          </p>
        </div>
      </div>
    </section>
  );
}

function Guarantee() {
  return (
    <section className="px-6 py-24 max-w-3xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600 mb-6">
        The Founder&apos;s Guarantee
      </div>
      <p className="text-2xl sm:text-3xl font-medium tracking-tight leading-snug">
        Get matched with 3 qualified founders in 7 days, or we refund every
        cent + give you a full year free.
      </p>
      <p className="mt-6 text-neutral-500">We can say that because the model works.</p>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free Forever",
      price: "$0",
      period: "",
      features: ["3 matches/week", "Reciprocity required"],
      cta: "Start Free",
      featured: false,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/mo",
      features: ["Unlimited matches", "Priority queue", "AI deal scout"],
      cta: "Go Pro",
      featured: true,
    },
    {
      name: "Vault",
      price: "$499",
      period: "/mo",
      features: [
        "Verified $1M+ revenue founders only",
        "White-glove curation",
      ],
      cta: "Apply to Vault",
      featured: false,
    },
  ];
  return (
    <section className="px-6 py-24 bg-neutral-50 border-y border-neutral-100">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
          Pricing
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={[
                "rounded-2xl p-6 flex flex-col",
                t.featured
                  ? "bg-neutral-900 text-white border border-neutral-900 shadow-xl"
                  : "bg-white border border-neutral-200",
              ].join(" ")}
            >
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {t.price}
                </span>
                <span
                  className={t.featured ? "text-neutral-400" : "text-neutral-500"}
                >
                  {t.period}
                </span>
              </div>
              <ul className="mt-6 space-y-2 text-sm flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span
                      className={
                        t.featured ? "text-emerald-400" : "text-emerald-600"
                      }
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span
                      className={
                        t.featured ? "text-neutral-100" : "text-neutral-700"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="#claim"
                className={[
                  "mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-colors",
                  t.featured
                    ? "bg-white text-neutral-900 hover:bg-neutral-100"
                    : "bg-neutral-900 text-white hover:bg-neutral-800",
                ].join(" ")}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qa = [
    {
      q: "What if I only want to hire, not offer?",
      a: "Then this isn't for you. Loop only works because everyone gives.",
    },
    {
      q: "How is the matching actually done?",
      a: "Claude analyzes your needs against every offer on the platform — by price, urgency, industry, and proven reputation. Not keywords. Not job titles.",
    },
    {
      q: "What's your cut?",
      a: "5–8% on closed paid engagements. Free tier pays nothing if no deal closes.",
    },
    {
      q: "Who's already on it?",
      a: "[Insert: X founders. $Y in deals closed. Z industries.]",
    },
  ];
  return (
    <section className="px-6 py-24 max-w-3xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
        FAQ
      </h2>
      <div className="mt-12 divide-y divide-neutral-200 border-y border-neutral-200">
        {qa.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium text-neutral-900 list-none">
              <span>{item.q}</span>
              <span className="text-neutral-400 transition-transform group-open:rotate-45 text-xl leading-none">
                +
              </span>
            </summary>
            <p className="mt-3 text-neutral-600 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section
      id="claim"
      className="px-6 py-24 text-center bg-neutral-50 border-t border-neutral-100"
    >
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Built for founders who ship.
      </h2>
      <div className="mt-8">
        <a
          href="#claim"
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-7 py-4 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Claim Your Founder Spot — Free
        </a>
      </div>
      <p className="mt-6 text-sm text-neutral-500">
        Only 500 spots left in the Founding Cohort.
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-10 text-center text-xs text-neutral-500 border-t border-neutral-100">
      © {new Date().getFullYear()} Loop. Reciprocity required.
    </footer>
  );
}
