import Link from "next/link";
import type { ReactNode } from "react";
import {
  Briefcase,
  Check,
  Inbox,
  ListChecks,
  Plus,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Landing page (Fable redesign, 2026-11-10).
// Fully static server render: the hero and its product preview are in
// the first paint, no typewriter, no reveal animation gating content.
// Every person shown in a preview is a fictional sample member.

export default function Home() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--fg-on-accent)]"
      >
        Skip to content
      </a>
      <SiteHeader
        sections={[
          { href: "#why", label: "Why Loop" },
          { href: "#how", label: "How it works" },
          { href: "#get", label: "What you get" },
          { href: "#free", label: "Free" },
          { href: "#faq", label: "FAQ" },
        ]}
      />
      <main
        id="main-content"
        className="bg-[var(--bg)] text-[var(--fg)] overflow-x-hidden"
      >
        <Hero />
        <Mission />
        <HowItWorks />
        <WhatYouGet />
        <FreeBlock />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* ---------------- shared bits ---------------- */

const WRAP = "mx-auto w-full max-w-6xl px-4 sm:px-6";

function SampleAvatar({
  initials,
  tint,
  size = 44,
}: {
  initials: string;
  tint: 1 | 2 | 3 | 4 | 5;
  size?: 36 | 44;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight text-[var(--fg)] ${
        size === 44 ? "h-11 w-11 text-[15px]" : "h-9 w-9 text-[13px]"
      }`}
      style={{ background: `var(--av-${tint})` }}
    >
      {initials}
    </span>
  );
}

function Score({ children }: { children: ReactNode }) {
  return (
    <span className="num shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-text)]">
      {children}
    </span>
  );
}

function PrimaryCta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/login"
      className={`press-shrink inline-flex h-14 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-[17px] font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}

function SectionHead({
  label,
  title,
  lead,
}: {
  label: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
        {label}
      </p>
      <h2 className="mt-3.5 text-[32px] sm:text-[44px] font-bold leading-[1.08] tracking-[-0.03em]">
        {title}
      </h2>
      {lead && (
        <p className="mt-3.5 text-[17px] sm:text-[19px] leading-relaxed text-[var(--fg-muted)]">
          {lead}
        </p>
      )}
    </div>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className={`${WRAP} grid items-center gap-12 lg:gap-16 pt-10 pb-16 sm:pt-16 sm:pb-24 lg:grid-cols-[minmax(0,540px)_1fr]`}
    >
      <div>
        <span className="inline-flex h-[30px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] pl-2.5 pr-3 text-[13px] font-semibold text-[var(--fg-muted)] shadow-[var(--shadow-1)]">
          <span className="h-2 w-2 rounded-full bg-[var(--ring)]" aria-hidden />
          Free for founders and builders
        </span>
        <h1
          id="hero-title"
          className="mt-5 text-[44px] sm:text-[64px] font-bold leading-[1.02] tracking-[-0.035em]"
        >
          Real work.
          <br />
          Real deals.
          <br />
          <span className="text-[var(--accent-text)]">No noise.</span>
        </h1>
        <p className="mt-5 max-w-[520px] text-[17px] sm:text-[19px] leading-relaxed text-[var(--fg-muted)]">
          Loop is a free professional network for people who build. Say what
          you need and what you offer, see your matches every day, and agree
          on the deal in your inbox. Loop takes no fee.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <PrimaryCta>Join free</PrimaryCta>
          <a
            href="#how"
            className="press-shrink inline-flex h-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-7 text-[17px] font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-[13px] text-[var(--fg-subtle)]">
          No card needed. Already on Loop?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--accent-text)] hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>

      <HeroPreview />
    </section>
  );
}

function HeroPreview() {
  const matches = [
    {
      name: "Tomás Ferreira",
      initials: "TF",
      tint: 3 as const,
      score: 92,
      why: "Offers cold email infrastructure. You need outbound set up before Q1.",
    },
    {
      name: "Priya Natarajan",
      initials: "PN",
      tint: 2 as const,
      score: 88,
      why: "Needs a fractional COO. You offer ops for early stage teams.",
    },
    {
      name: "Daniel Okafor",
      initials: "DO",
      tint: 4 as const,
      score: 81,
      why: "Offers brand systems in 3 weeks. You need a rebrand before launch.",
    },
  ];
  return (
    <figure className="relative" aria-label="Preview of Loop with sample members">
      <div className="relative xl:h-[540px]">
        {/* Today's matches */}
        <div className="surface-card p-5 xl:absolute xl:left-7 xl:top-0 xl:w-[468px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Today&apos;s matches</p>
              <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.01em]">
                3 founders fit what you need
              </p>
            </div>
            <span className="chip chip-neutral num">Tue 6:00 AM</span>
          </div>
          <ul className="mt-2">
            {matches.map((m, i) => (
              <li
                key={m.name}
                className={`flex items-center gap-3 py-3.5 ${
                  i > 0 ? "border-t border-[var(--border)]" : ""
                }`}
              >
                <SampleAvatar initials={m.initials} tint={m.tint} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate text-[13px] sm:text-sm font-semibold">
                      {m.name}
                    </strong>
                    <Score>{m.score} fit</Score>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-[var(--fg-muted)]">
                    {m.why}
                  </p>
                </div>
                <span className="hidden sm:inline-flex h-8 shrink-0 items-center rounded-full bg-[var(--accent-soft)] px-3 text-[13px] font-semibold text-[var(--accent-text)]">
                  Say hi
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:mt-0 xl:block">
          {/* A need */}
          <div className="surface-card p-4 shadow-[var(--shadow-2)] xl:absolute xl:left-0 xl:bottom-0 xl:w-[230px]">
            <span className="chip chip-need">Need</span>
            <p className="mt-2.5 text-[13px] font-semibold">
              Fractional CFO for a seed round
            </p>
            <p className="mt-1 text-xs text-[var(--fg-muted)]">
              <span className="num">$4k</span> to <span className="num">$6k</span> a
              month. Starts in 2 weeks.
            </p>
            <p className="mt-3 flex gap-1.5 num text-xs text-[var(--accent-text)]">
              <span>#cfo</span>
              <span>#saas</span>
            </p>
          </div>

          {/* A closed deal */}
          <div className="surface-card flex items-start gap-2.5 p-4 shadow-[var(--shadow-2)] xl:absolute xl:right-0 xl:bottom-0 xl:w-[256px]">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--offer-bg)] text-[var(--offer-fg)]"
            >
              <Check className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <strong className="text-[13px] font-semibold">Deal closed</strong>
              <p className="mt-1 text-[13px] text-[var(--fg-muted)]">
                Cold email setup, <span className="num">$2,400</span>. No Loop fee.
              </p>
              <span className="pill-status st-released mt-2.5">Paid</span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-[var(--fg-subtle)] xl:text-right">
        Sample members shown for illustration.
      </figcaption>
    </figure>
  );
}

/* ---------------- Mission ---------------- */

// Why Loop exists. About the company and the network, never a person.
function Mission() {
  const broken = [
    "Messages go unanswered.",
    "Comments chase status.",
    "Half the activity is bots.",
  ];
  const different = [
    {
      title: "Every member gives as well as gets.",
      body: "You list what you can do for others, not just what you want.",
    },
    {
      title: "People who reply and deliver rise to the top.",
      body: "Not people with the biggest following.",
    },
  ];
  return (
    <section
      id="why"
      aria-labelledby="why-title"
      className="scroll-mt-20 bg-[var(--ink)] text-[var(--fg-on-ink)] py-16 sm:py-24"
    >
      <div className={`${WRAP} grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--fg-on-ink-muted)]">
            Why Loop
          </p>
          <h2
            id="why-title"
            className="mt-3.5 text-[32px] sm:text-[44px] font-bold leading-[1.08] tracking-[-0.03em]"
          >
            Networking stopped being about people.
          </h2>
          <ul className="mt-6 space-y-2 text-[19px] sm:text-[22px] leading-snug text-[var(--fg-on-ink-muted)]">
            {broken.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[var(--r-xl)] border border-[var(--ink-border)] bg-[var(--ink-2)] p-6 sm:p-8">
          <p className="text-[24px] sm:text-[28px] font-bold tracking-[-0.02em]">Loop is different.</p>
          <ul className="mt-5 space-y-5">
            {different.map((d) => (
              <li key={d.title} className="flex gap-3">
                <span
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--fg-on-accent)]"
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[17px] font-semibold">{d.title}</span>
                  <span className="mt-0.5 block text-[15px] leading-relaxed text-[var(--fg-on-ink-muted)]">
                    {d.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */

function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-title"
      className="scroll-mt-20 border-y border-[var(--border)] bg-[var(--surface-1)] py-16 sm:py-24"
    >
      <div className={WRAP}>
        <SectionHead
          label="How it works"
          title={<span id="how-title">Three steps. Then you are talking to the right person.</span>}
          lead="Loop only works because everyone gives as well as gets. You list both sides, and matching does the searching for you."
        />
        <ol className="mt-10 sm:mt-12 grid gap-5 md:grid-cols-3">
          <Step
            n="01"
            title="Say what you offer"
            body="Design, cold email, fractional finance, iOS, anything you actually deliver. Add a category and a range so matches are realistic."
          >
            <p className="eyebrow">Offer</p>
            <p className="mt-1.5 text-[13px] font-semibold">Brand systems in 3 weeks</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="chip chip-offer">Design</span>
              <span className="chip chip-neutral num">From $8k</span>
              <span className="chip chip-neutral">Fixed scope</span>
            </div>
          </Step>
          <Step
            n="02"
            title="Say what you need"
            body="Budget, timeline and the shape of the work. Specific needs get specific matches."
          >
            <p className="eyebrow">Need</p>
            <p className="mt-1.5 text-[13px] font-semibold">Outbound set up before Q1</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="chip chip-need">Sales</span>
              <span className="chip chip-neutral num">$2k to $3k</span>
              <span className="chip chip-neutral">2 weeks</span>
            </div>
          </Step>
          <Step
            n="03"
            title="See your matches every day"
            body="Loop scores offers against needs and explains each match in a sentence. Say hi, or keep browsing."
          >
            <div className="flex items-center gap-2.5">
              <SampleAvatar initials="TF" tint={3} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[13px] font-semibold">Tomás Ferreira</strong>
                  <Score>92 fit</Score>
                </div>
                <p className="text-xs text-[var(--fg-muted)]">
                  Offers cold email infrastructure
                </p>
              </div>
            </div>
            <span className="mt-3 flex h-8 w-full items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-semibold text-[var(--fg-on-accent)]">
              Say hi
            </span>
          </Step>
        </ol>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  body,
  children,
}: {
  n: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <li className="surface-card flex flex-col gap-4 p-6 md:min-h-[400px]">
      <span className="num text-[13px] font-semibold text-[var(--accent-text)]">
        {n}
      </span>
      <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.015em]">
        {title}
      </h3>
      <p className="text-[var(--fg-muted)]">{body}</p>
      <div
        aria-hidden
        className="mt-auto rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3.5"
      >
        {children}
      </div>
    </li>
  );
}

/* ---------------- What you get ---------------- */

function WhatYouGet() {
  const features = [
    {
      icon: UserRound,
      title: "A profile with receipts",
      body: "Experience, education, certifications and the offers you want to be known for, plus deals closed and reviews from the people you worked with.",
    },
    {
      icon: ListChecks,
      title: "A feed about work",
      body: "Needs, offers and shipped work, with comments and reactions. Follow people and companies.",
    },
    {
      icon: Sparkles,
      title: "Daily matches",
      body: "The offers that fit your needs and the needs that fit your offers, each with a plain reason why.",
    },
    {
      icon: Inbox,
      title: "Deals in your inbox, no fee",
      body: "Agree on scope and price in the same thread where you talk. Documents live there too. Loop takes nothing.",
    },
    {
      icon: Briefcase,
      title: "Jobs and company pages",
      body: "Post roles from your company page and follow the companies you care about.",
    },
    {
      icon: Trophy,
      title: "Groups, leaderboard, public card",
      body: "Rooms for your niche, a leaderboard ranked by shipped work, and a public business card you can share anywhere.",
    },
  ];
  return (
    <section
      id="get"
      aria-labelledby="get-title"
      className="scroll-mt-20 py-16 sm:py-24"
    >
      <div className={WRAP}>
        <SectionHead
          label="What you get"
          title={
            <span id="get-title">
              Everything a professional network should do, built around the work.
            </span>
          }
          lead="A profile that shows receipts, a feed about shipping, and an inbox where deals actually get agreed."
        />
        <ul className="mt-10 sm:mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="surface-card p-6">
              <span
                aria-hidden
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]"
              >
                <f.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                {f.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Free ---------------- */

function FreeBlock() {
  const items = [
    "Full profile, experience and portfolio",
    "Unlimited posts, comments and follows",
    "Unlimited messages",
    "Daily matches on needs and offers",
    "Jobs, groups and company pages",
    "Paid deals with no Loop fee",
  ];
  return (
    <section
      id="free"
      aria-labelledby="free-title"
      className="scroll-mt-20 pb-16 sm:pb-24"
    >
      <div className={WRAP}>
        <div className="surface-card grid items-center gap-10 p-6 sm:p-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              Free
            </p>
            <h2
              id="free-title"
              className="mt-3.5 text-[32px] sm:text-[44px] font-bold leading-[1.08] tracking-[-0.03em]"
            >
              Free. All of it.
            </h2>
            <p className="mt-3.5 text-[17px] sm:text-[19px] leading-relaxed text-[var(--fg-muted)]">
              No paywall on messages. No card needed. Every member gets every
              feature.
            </p>
            <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {items.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[15px]">
                  <Check
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]"
                    strokeWidth={2.2}
                  />
                  {t}
                </li>
              ))}
            </ul>
            <PrimaryCta className="mt-8 !h-12 !text-base">Join free</PrimaryCta>
          </div>
          <div className="hidden md:block text-center" aria-hidden>
            <p className="text-[96px] lg:text-[120px] font-bold leading-none tracking-[-0.05em]">
              Free
            </p>
            <p className="mt-2 text-lg text-[var(--fg-muted)]">
              for every member, every feature
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

function Faq() {
  const items = [
    {
      q: "Who is Loop for?",
      a: "Founders, operators, freelancers and anyone who builds things for other people. If you can deliver work and you sometimes need work done, Loop fits.",
    },
    {
      q: "Is it really free?",
      a: "Yes. Every feature, every member. When you close a paid deal on Loop, Loop takes no fee.",
    },
    {
      q: "Do I have to offer something?",
      a: "Loop works best when everyone gives as well as gets. List at least one offer and one need and matching has something to work with.",
    },
    {
      q: "How does matching work?",
      a: "Loop compares your needs with the offers on the platform by category, budget, timeline and track record, then writes a short reason for each match. Not keywords, not job titles.",
    },
    {
      q: "What happens when I agree on a deal?",
      a: "You agree on the scope and amount in your inbox thread with the other person. When the work is done, both sides can leave a review, and the deal shows up on your profile.",
    },
    {
      q: "Can I bring my LinkedIn profile?",
      a: "You rebuild it in a few minutes: experience, education, certifications, and the offers you want to be known for. Your public card is live as soon as you save.",
    },
  ];
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--surface-1)] py-16 sm:py-24"
    >
      <div className={`${WRAP} grid gap-10 lg:grid-cols-[400px_1fr] lg:gap-16`}>
        <SectionHead
          label="Questions"
          title={<span id="faq-title">Straight answers.</span>}
          lead="Anything else, message us inside Loop and a real person replies."
        />
        <div className="border-b border-[var(--border)]">
          {items.map((item) => (
            <details
              key={item.q}
              className="group border-t border-[var(--border)]"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-semibold tracking-[-0.01em] rounded-lg [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  aria-hidden
                  className="h-5 w-5 shrink-0 text-[var(--fg-subtle)] transition-transform group-open:rotate-45"
                />
              </summary>
              <p className="-mt-1 pb-5 pr-9 leading-relaxed text-[var(--fg-muted)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCta() {
  return (
    <section
      aria-labelledby="final-title"
      className="relative isolate overflow-hidden bg-[var(--ink)] py-20 sm:py-28 text-center text-[var(--fg-on-ink)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 50% at 30% 40%, rgba(63,211,154,.18), transparent 60%), radial-gradient(40% 40% at 75% 60%, rgba(63,211,154,.10), transparent 60%)",
        }}
      />
      <div className={WRAP}>
        <h2
          id="final-title"
          className="text-[40px] sm:text-[64px] font-bold leading-[1.02] tracking-[-0.035em] text-white"
        >
          Built for founders who ship.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] sm:text-[19px] text-[var(--fg-on-ink-muted)]">
          List one offer and one need. Your matches start from there.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="press-shrink inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-full bg-white px-7 text-[17px] font-semibold text-[#141F1B] hover:bg-[#E9EEEB] transition-colors"
          >
            Join free
          </Link>
          <Link
            href="/login"
            className="press-shrink inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-full border border-[var(--ink-border)] px-7 text-[17px] font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Log in
          </Link>
        </div>
        <p className="mt-4 text-[13px] text-[var(--fg-on-ink-muted)]">
          Free. No card needed.
        </p>
      </div>
    </section>
  );
}
