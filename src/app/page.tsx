import { MotionMount } from "./_components/MotionMount";

export default function Home() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--bg)]"
      >
        Skip to content
      </a>
      <Nav />
      <main
        id="main-content"
        className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]"
      >
        <MotionMount />
        <Hero />
        <Broken />
        <HowItWorks />
        <WhatYouGet />
        <Pricing />
        <Faq />
        <FinalCta />
        <Footer />
      </main>
    </>
  );
}

/* ---------------- Nav ---------------- */

function Nav() {
  const links = [
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/70 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto max-w-6xl px-5 sm:px-6 h-14 sm:h-16 flex items-center justify-between"
      >
        <a
          href="/"
          aria-label="Loop home"
          className="flex items-center gap-2.5 press-shrink"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/loop-mark.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="font-semibold tracking-tight text-[var(--fg)]">
            Loop
          </span>
        </a>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden md:flex items-center gap-1 mr-2">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="px-3 py-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] rounded-full transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="/login"
            className="press-shrink inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-[var(--bg)] hover:brightness-110 transition-[filter]"
          >
            Sign in
          </a>
        </div>
      </nav>
    </header>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] flex items-center overflow-hidden pt-20 pb-24 sm:pt-24 sm:pb-32">
      {/* Parallax mesh background — moves at 0.3x scroll */}
      <div
        data-parallax="0.3"
        className="mesh-bg absolute inset-0 -z-10"
        aria-hidden
      />
      {/* Animated constellation — moves at 0.5x scroll (between mesh and
          headline). Visible on every screen size; we step the opacity
          and parallax intensity down slightly on phones so it stays
          subtle behind the wrapped headline. */}
      <div
        data-parallax="0.4"
        className="absolute inset-0 -z-10 opacity-50 sm:opacity-70"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-constellation.svg"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      {/* Subtle grain over mesh */}
      <div className="grain absolute inset-0 -z-10" aria-hidden />
      {/* Top + bottom vignette for legibility */}
      <div
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--bg)] to-transparent -z-10"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent -z-10"
        aria-hidden
      />

      <div
        data-reveal
        className="reveal mx-auto max-w-5xl px-6 text-center"
      >
        <div
          data-parallax="0.85"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.03] backdrop-blur-sm px-3 py-1 mb-8 reveal-child"
          style={{ ["--stagger-delay" as string]: "0ms" }}
        >
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          <span className="eyebrow !text-[var(--fg-muted)]">
            Founding Cohort · 500 spots left
          </span>
        </div>

        <h1
          data-parallax="0.85"
          className="text-[clamp(2.75rem,8vw,6.5rem)] font-semibold tracking-[-0.04em] leading-[0.95]"
        >
          <span
            className="reveal-child inline-block"
            style={{ ["--stagger-delay" as string]: "60ms" }}
          >
            Stop
          </span>{" "}
          <span
            className="reveal-child inline-block"
            style={{ ["--stagger-delay" as string]: "130ms" }}
          >
            networking.
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--fg)] to-[var(--fg-muted)] bg-clip-text text-transparent">
            <span
              className="reveal-child inline-block"
              style={{ ["--stagger-delay" as string]: "210ms" }}
            >
              Start
            </span>{" "}
            <span
              className="reveal-child inline-block"
              style={{ ["--stagger-delay" as string]: "290ms" }}
            >
              building.
            </span>
          </span>
          <span
            className="reveal-child cursor-blink ml-1 text-[var(--accent)] align-baseline"
            style={{ ["--stagger-delay" as string]: "380ms" }}
            aria-hidden
          >
            ▌
          </span>
        </h1>

        <p
          className="reveal-child mt-8 text-lg sm:text-xl text-[var(--fg-muted)] max-w-2xl mx-auto leading-relaxed"
          style={{ ["--stagger-delay" as string]: "160ms" }}
        >
          The first platform where every founder must give AND receive. AI
          matches your needs to another founder&apos;s services in under 24 hours.
        </p>

        <div
          className="reveal-child mt-12 flex flex-col sm:flex-row gap-3 justify-center"
          style={{ ["--stagger-delay" as string]: "240ms" }}
        >
          <a
            href="/login"
            className="press-shrink glow-ring inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-7 py-4 text-sm font-medium text-[var(--bg)] hover:brightness-110 transition-[filter] duration-200"
          >
            Claim Your Spot — Free
          </a>
          <a
            href="#how"
            className="press-shrink inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-7 py-4 text-sm font-medium text-[var(--fg)] hover:bg-white/[0.05] transition-colors"
          >
            See How It Works ↓
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- LinkedIn is broken ---------------- */

function Broken() {
  const items = [
    'Another connection request from a "growth hacker"',
    "A feed of motivational posts from people who've never shipped",
    "To pay $99/mo to InMail people who'll never reply",
  ];
  return (
    <section className="relative py-20 sm:py-32 px-6 border-t border-[var(--border)]">
      <div data-reveal className="reveal max-w-3xl mx-auto">
        <p className="eyebrow mb-4">The problem</p>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
          LinkedIn is broken for founders.
        </h2>
        <p className="mt-6 text-[var(--fg-muted)]">You don&apos;t need:</p>
        <ul className="mt-8 space-y-4">
          {items.map((t, i) => (
            <li
              key={t}
              className="reveal-child flex items-start gap-4 font-mono text-[var(--fg)] text-base"
              style={{ ["--stagger-delay" as string]: `${i * 80}ms` }}
            >
              <span className="text-[var(--danger)] mt-0.5" aria-hidden>
                ✕
              </span>
              <span className="line-through decoration-[var(--danger)]/60 decoration-2">{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-xl sm:text-2xl font-medium text-[var(--fg)] tracking-tight">
          You need: the right person, with the right skill, ready to start
          today.
        </p>
      </div>
    </section>
  );
}

/* ---------------- How it works (bento) ---------------- */

function HowItWorks() {
  return (
    <section
      id="how"
      className="relative py-20 sm:py-32 px-6 border-t border-[var(--border)] scroll-mt-20"
    >
      <div data-reveal className="reveal max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="eyebrow mb-4">How Loop works</p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
            Three steps. No theater.
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Big tile — spans 7 cols on desktop, full on mobile */}
          <BentoTile
            n="01"
            title="List what you sell."
            body="Web design. Cold email. Fractional CFO. Anything you actually deliver."
            className="col-span-12 lg:col-span-7 lg:row-span-2 min-h-[18rem] lg:min-h-[24rem]"
            delay={0}
          >
            <div className="absolute bottom-6 right-6 left-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 font-mono text-xs text-[var(--fg-muted)]">
              <span className="text-[var(--accent)]">offer</span>:{" "}
              fractional-cfo-saas-seed
              <br />
              <span className="text-[var(--accent)]">price</span>: $4k–$8k / mo
              <br />
              <span className="text-[var(--accent)]">status</span>: active
            </div>
          </BentoTile>

          {/* Two medium tiles right */}
          <BentoTile
            n="02"
            title="List what you need."
            body="Required. No spectators."
            className="col-span-12 lg:col-span-5 min-h-[11rem] lg:min-h-[11.5rem]"
            delay={120}
          />
          <BentoTile
            n="03"
            title="3 matches by morning."
            body="Hire on the spot, or build the relationship first. Your call."
            className="col-span-12 lg:col-span-5 min-h-[11rem] lg:min-h-[11.5rem]"
            delay={240}
          />
        </div>

        <p className="mt-12 text-center text-[var(--fg-subtle)]">
          That&apos;s it. No feed. No likes. No theater.
        </p>
      </div>
    </section>
  );
}

function BentoTile({
  n,
  title,
  body,
  className,
  delay,
  children,
}: {
  n: string;
  title: string;
  body: string;
  className?: string;
  delay: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`reveal-child relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-8 hover:border-[var(--border-strong)] transition-colors ${className ?? ""}`}
      style={{ ["--stagger-delay" as string]: `${delay}ms` }}
    >
      <span className="eyebrow text-[var(--accent)]">{n}</span>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[var(--fg-muted)] text-sm leading-relaxed max-w-sm">
        {body}
      </p>
      {children}
    </div>
  );
}

/* ---------------- What you get (free) ---------------- */

function WhatYouGet() {
  const perks = [
    { title: "AI-matched introductions every 24 hours", value: "$2,000/mo" },
    { title: "Founder-only network — verified revenue, no recruiters", value: "$500/mo" },
    { title: "Escrow-protected contracts — funds held until delivery", value: "$300/mo" },
    { title: "Auto-drafted warm intros — Loop writes the opener", value: "$200/mo" },
    { title: "Outcome-based reputation score — receipts, not endorsements", value: "priceless" },
  ];
  return (
    <section className="relative py-20 sm:py-32 px-6 border-t border-[var(--border)]">
      <div data-reveal className="reveal max-w-4xl mx-auto">
        <p className="eyebrow mb-4">What you get</p>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
          For free. While you reciprocate.
        </h2>
        <ul className="mt-12 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {perks.map((p, i) => (
            <li
              key={p.title}
              className="reveal-child flex items-start justify-between gap-6 py-5"
              style={{ ["--stagger-delay" as string]: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <span className="text-[var(--accent)] mt-0.5" aria-hidden>
                  ✓
                </span>
                <span className="text-[var(--fg)]">{p.title}</span>
              </div>
              <span className="font-mono text-xs text-[var(--fg-subtle)] shrink-0 tabular-nums">
                {p.value}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-8 text-center">
          <p className="text-lg">
            Total value:{" "}
            <span className="font-semibold tabular-nums">$3,000+/mo</span>. Your
            price: <span className="font-semibold text-[var(--accent)]">$0</span>
            {" "}— as long as you reciprocate.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Pricing ---------------- */

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
      features: ["Verified $1M+ revenue founders only", "White-glove curation"],
      cta: "Apply to Vault",
      featured: false,
    },
  ];
  return (
    <section
      id="pricing"
      className="relative py-20 sm:py-32 px-6 border-t border-[var(--border)] scroll-mt-20"
    >
      <div data-reveal className="reveal max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="eyebrow mb-4">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
            Pick a lane.
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              className={[
                "reveal-child relative rounded-2xl p-7 flex flex-col transition-transform duration-300",
                t.featured
                  ? "border border-[var(--accent)]/40 bg-[var(--surface-2)] glow-ring sm:scale-[1.05]"
                  : "border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-strong)]",
              ].join(" ")}
              style={{ ["--stagger-delay" as string]: `${i * 100}ms` }}
            >
              {t.featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider text-[var(--bg)]">
                  Most loved
                </span>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-[-0.03em] tabular-nums">
                  {t.price}
                </span>
                <span className="text-[var(--fg-subtle)]">{t.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[var(--accent)]" aria-hidden>
                      ✓
                    </span>
                    <span className="text-[var(--fg)]">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/login"
                className={[
                  "press-shrink mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-colors",
                  t.featured
                    ? "bg-[var(--accent)] text-[var(--bg)] hover:brightness-110"
                    : "border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg)] hover:bg-white/[0.05]",
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

/* ---------------- FAQ ---------------- */

function Faq() {
  const qa = [
    {
      q: "What if I only want to hire, not offer?",
      a: "Then this isn't for you. Loop only works because everyone gives.",
    },
    {
      q: "How is the matching actually done?",
      a: "Loop analyzes your needs against every offer on the platform — by price, urgency, industry, and proven reputation. Not keywords. Not job titles.",
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
    <section
      id="faq"
      className="relative py-20 sm:py-32 px-6 border-t border-[var(--border)] scroll-mt-20"
    >
      <div data-reveal className="reveal max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="eyebrow mb-4">Questions</p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
            FAQ
          </h2>
        </div>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {qa.map((item) => (
            <details key={item.q} className="group py-6">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium text-[var(--fg)] list-none">
                <span>{item.q}</span>
                <span className="text-[var(--fg-subtle)] transition-transform duration-300 group-open:rotate-45 text-2xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA (mirror hero) ---------------- */

function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-40 px-6 border-t border-[var(--border)]">
      <div className="mesh-bg absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--bg)] to-transparent -z-10"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent -z-10"
        aria-hidden
      />
      <div data-reveal className="reveal max-w-3xl mx-auto text-center">
        <h2 className="text-4xl sm:text-6xl font-semibold tracking-[-0.04em]">
          Built for founders who ship.
        </h2>
        <div className="mt-10">
          <a
            href="/login"
            className="press-shrink glow-ring inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-8 py-5 text-base font-medium text-[var(--bg)] hover:brightness-110 transition-[filter]"
          >
            Claim Your Founder Spot — Free
          </a>
        </div>
        <p className="mt-8 eyebrow">Only 500 spots left in the Founding Cohort</p>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="px-6 py-10 text-center border-t border-[var(--border)]">
      <p className="eyebrow !text-[var(--fg-subtle)]">
        © {new Date().getFullYear()} Loop · Reciprocity required
      </p>
    </footer>
  );
}
