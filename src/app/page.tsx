"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  Home,
  Car,
  Building2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Phone,
  Check,
  X,
  Star,
  ShieldCheck,
  Clock,
  Lock,
  ChevronDown,
  Zap,
  FileSearch,
  Target,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-grid">
      <Nav />
      <Hero />
      <TrustBar />
      <Problem />
      <Transformation />
      <Offer />
      <LeadForm />
      <HowItWorks />
      <Proof />
      <Goals />
      <Guarantee />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function CTA({ children = "Get My FREE Credit Analysis", className = "", href = "#apply" }: { children?: React.ReactNode; className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl gold-gradient px-7 py-4 text-base font-extrabold text-black shadow-[0_10px_40px_-10px_rgba(232,183,62,0.6)] transition hover:brightness-105 ${className}`}
    >
      {children}
      <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-ink)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-4">
          <a href="tel:6893256649" className="hidden items-center gap-1.5 text-sm font-semibold text-slate-200 sm:flex">
            <Phone size={15} className="text-sky-400" /> (689) 325-6649
          </a>
          <Link href="/dashboard" className="hidden text-xs font-medium text-slate-400 hover:text-white md:block">
            Team Login
          </Link>
          <CTA className="px-4 py-2 text-sm">Free Analysis</CTA>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Sparkles size={13} /> Trusted since 2018 · Faith-Driven. Results-Focused.
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.03] text-white sm:text-5xl lg:text-[3.4rem]">
            Get the <span className="gold-text">negative items removed</span> and finally qualify for the
            home, car, or funding you deserve.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            We challenge the collections, charge-offs, and late payments dragging your score down — with a
            custom dispute strategy built for <b className="text-white">maximum deletions</b>. Most clients see
            movement in <b className="text-sky-300">45–90 days</b>.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CTA />
            <a href="tel:6893256649" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] px-6 py-4 font-semibold text-white hover:bg-white/5">
              <Phone size={17} className="text-sky-400" /> Talk to me 1st
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-400" /> No contracts</span>
            <span className="flex items-center gap-1.5"><Lock size={15} className="text-sky-400" /> 100% confidential</span>
            <span className="flex items-center gap-1.5"><Clock size={15} className="text-amber-400" /> Cancel anytime</span>
          </div>
        </div>

        {/* Before/After visual */}
        <div className="fade-up">
          <div className="card glow relative p-6">
            <div className="absolute -top-3 left-6 rounded-full brand-gradient px-3 py-1 text-[11px] font-bold text-white">
              REAL CLIENT TRANSFORMATION
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-red-300/80">Before</div>
                <div className="mt-1 text-4xl font-black text-red-400">540</div>
                <div className="text-xs text-slate-400">Denied · co-signer needed</div>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">After</div>
                <div className="mt-1 text-4xl font-black text-emerald-400">648</div>
                <div className="text-xs text-slate-400">Approved · no co-signer</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                "Eviction public record — DELETED",
                "Conn's charge-off ($980) — DELETED",
                "IC System collection — DELETED",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                  <Check size={15} className="text-emerald-400" /> {t}
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs italic text-slate-500">
              “This changed my life.” — Robert L., approved for his apartment
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { n: "1,200+", l: "Negative items challenged" },
    { n: "45–90", l: "Days to see results" },
    { n: "Since 2018", l: "Repairing credit" },
    { n: "5.0★", l: "Client-rated service" },
  ];
  return (
    <div className="border-y border-[var(--color-line)] bg-[var(--color-panel)]/50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 py-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-2xl font-black gold-text">{s.n}</div>
            <div className="text-xs text-slate-400">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Problem() {
  const pains = [
    "Denied for a mortgage — or stuck renting because of your score",
    "Paying thousands more in interest on your car and cards",
    "Collections and charge-offs you don't even recognize",
    "Told to “just wait 7 years” — while life passes you by",
    "Bankruptcy feels like the only option left",
  ];
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 text-center">
      <h2 className="text-3xl font-black text-white sm:text-4xl">
        Bad credit is costing you more than you think.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-slate-300">
        Every month those negative items sit on your report, they cost you real money and real opportunities.
        Sound familiar?
      </p>
      <div className="mx-auto mt-8 max-w-2xl space-y-2 text-left">
        {pains.map((p) => (
          <div key={p} className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-400">
              <X size={15} />
            </span>
            <span className="text-slate-200">{p}</span>
          </div>
        ))}
      </div>
      <p className="mt-8 text-lg font-semibold text-white">
        It doesn't matter what you owe. <span className="gold-text">It can be removed.</span>
      </p>
    </section>
  );
}

function Transformation() {
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-panel)]/40">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-3xl font-black text-white sm:text-4xl">
          Imagine 90 days from now…
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <div className="mb-3 inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">WHERE YOU ARE</div>
            <ul className="space-y-2.5">
              {["Score stuck in the 500s", "Negative items reporting on all 3 bureaus", "Getting denied or paying sky-high rates", "No clear plan to fix it"].map((t) => (
                <li key={t} className="flex items-start gap-2 text-slate-300"><X size={17} className="mt-0.5 shrink-0 text-red-400" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="card glow p-6">
            <div className="mb-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">WHERE WE TAKE YOU</div>
            <ul className="space-y-2.5">
              {["Items challenged and falling off your report", "A clear 6–12 month game plan to your goal", "Approved for the home, car, or funding", "A specialist texting you every win"].map((t) => (
                <li key={t} className="flex items-start gap-2 text-slate-200"><Check size={17} className="mt-0.5 shrink-0 text-emerald-400" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Offer() {
  const stack = [
    { item: "Full 3-Bureau AI Credit Analysis", value: "$149", icon: FileSearch },
    { item: "Personalized 6–12 Month Goal Game Plan", value: "$297", icon: Target },
    { item: "Custom Dispute Letters — every round until it's gone", value: "$497", icon: Zap },
    { item: "Direct text + email line to your specialist", value: "$197", icon: Phone },
    { item: "Private portal to watch items fall off in real time", value: "$149", icon: TrendingUp },
    { item: "30-day progress check-ins & reminders", value: "$99", icon: Clock },
  ];
  return (
    <section id="start" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-16">
      <div className="text-center">
        <h2 className="text-3xl font-black text-white sm:text-4xl">
          The Credit Restoration <span className="gold-text">Game Plan</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Everything you need to remove the negative, rebuild the positive, and get approved — done for you.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <div className="space-y-3">
            {stack.map((s) => (
              <div key={s.item} className="flex items-center gap-3 border-b border-[var(--color-line)] pb-3 last:border-0 last:pb-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-300">
                  <s.icon size={17} />
                </div>
                <span className="flex-1 text-sm text-slate-200">{s.item}</span>
                <span className="text-sm font-semibold text-slate-400 line-through decoration-slate-600">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
            <span className="font-semibold text-white">Total value</span>
            <span className="text-xl font-black text-slate-300 line-through decoration-red-500/60">$1,388</span>
          </div>
        </div>

        <div className="card glow flex flex-col justify-center p-7 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 live-dot" /> Limited new-client spots this month
          </div>
          <div className="text-sm font-semibold uppercase tracking-wide text-amber-300">Start today for</div>
          <div className="mt-1 text-5xl font-black text-white">$0</div>
          <div className="text-sm text-slate-400">Free credit analysis — no obligation</div>
          <div className="my-5 h-px bg-[var(--color-line)]" />
          <p className="text-sm text-slate-300">
            After your free analysis, simple month-to-month pricing. <b className="text-white">No contracts. Cancel anytime.</b>
          </p>
          <CTA className="mt-5 w-full" />
          <a href="tel:6893256649" className="mt-3 text-sm font-semibold text-sky-300 hover:underline">
            or call (689) 325-6649
          </a>
        </div>
      </div>
    </section>
  );
}

function LeadForm() {
  const goals = ["Buy a Home", "Buy a Car", "Rent an Apartment", "Start a Business", "Business Funding", "Just rebuild my score"];
  const [form, setForm] = useState({ name: "", phone: "", email: "", goal: "Buy a Home" });
  const [sent, setSent] = useState(false);
  const ready = form.name.trim() && form.phone.trim();

  return (
    <section id="apply" className="scroll-mt-20 border-y border-[var(--color-line)] bg-[var(--color-panel)]/40">
      <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-16 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Sparkles size={13} /> 100% Free · No obligation
          </span>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
            Get your <span className="gold-text">free credit analysis</span>
          </h2>
          <p className="mt-3 text-slate-300">
            Tell us where you want to go and we'll pull together a no-cost breakdown of what's hurting your
            score — and the exact plan to fix it. Takes 30 seconds.
          </p>
          <ul className="mt-5 space-y-2">
            {["See every negative item that can be challenged", "A custom plan mapped to your goal", "No pressure, no contracts — just answers"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-slate-200">
                <Check size={16} className="text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
            <Lock size={15} className="text-sky-400" /> Your information is private &amp; secure.
          </div>
        </div>

        <div className="card glow p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Check size={28} />
              </div>
              <h3 className="text-xl font-black text-white">You're in, {form.name.split(" ")[0] || "friend"}! 🎉</h3>
              <p className="max-w-xs text-sm text-slate-300">
                Jonathan will personally reach out at <b className="text-white">{form.phone}</b> with your free
                analysis. Want answers faster?
              </p>
              <a href="tel:6893256649" className="mt-1 inline-flex items-center gap-2 rounded-xl gold-gradient px-5 py-3 text-sm font-extrabold text-black">
                <Phone size={16} /> Call (689) 325-6649 now
              </a>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (ready) setSent(true);
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-xs text-slate-400">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 555-5555"
                    inputMode="tel"
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Email <span className="text-slate-600">(optional)</span></label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                    inputMode="email"
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">What's your #1 goal?</label>
                <select
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:border-sky-500/50 focus:outline-none"
                >
                  {goals.map((g) => (
                    <option key={g} value={g} className="bg-[var(--color-panel)]">{g}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={!ready}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl gold-gradient px-6 py-3.5 text-base font-extrabold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Get My FREE Analysis <ArrowRight size={18} />
              </button>
              <p className="text-center text-[11px] text-slate-500">
                By submitting you agree to be contacted about your credit. No spam, ever.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, icon: FileSearch, t: "Upload your report", d: "Send us your 3-bureau credit report. Our AI reads every line and finds the items hurting you most." },
    { n: 2, icon: Target, t: "Get your game plan", d: "You receive a detailed analysis and a 6–12 month plan mapped to your exact goal — home, car, apartment, or funding." },
    { n: 3, icon: Zap, t: "We dispute, you watch", d: "We fire off custom dispute letters round after round and you watch negative items fall off in your portal." },
  ];
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-panel)]/40">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-3xl font-black text-white sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card relative p-6">
              <div className="absolute -top-3 left-6 grid h-8 w-8 place-items-center rounded-full brand-gradient text-sm font-black text-white">
                {s.n}
              </div>
              <div className="mt-3 mb-3 grid h-11 w-11 place-items-center rounded-xl bg-sky-500/10 text-sky-300">
                <s.icon size={20} />
              </div>
              <div className="font-bold text-white">{s.t}</div>
              <p className="mt-1 text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Proof() {
  const reviews = [
    { name: "Robert L.", goal: "Apartment approved", body: "Man I can't thank you enough. Eviction gone, score up 100+ points, approved with no co-signer. This changed my life." },
    { name: "Maria S.", goal: "Home in progress", body: "Capital One charge-off DELETED off TransUnion. Up 73 points since February and finally on track for our house this fall." },
    { name: "Darnell W.", goal: "Business funding", body: "Jonathan got my personal credit funding-ready and built my business credit stack. Already opened my business account. Let's go 🔥" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="text-center text-3xl font-black text-white sm:text-4xl">
        Real people. Real deletions. Real approvals.
      </h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {reviews.map((r) => (
          <div key={r.name} className="card p-6">
            <div className="mb-2 flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
            </div>
            <p className="text-sm text-slate-200">“{r.body}”</p>
            <div className="mt-4 text-sm font-semibold text-white">{r.name}</div>
            <div className="text-xs text-sky-300">{r.goal}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Goals() {
  const goals = [
    { icon: Home, label: "Buy a Home" },
    { icon: Car, label: "Buy a Car" },
    { icon: Building2, label: "Rent an Apartment" },
    { icon: Sparkles, label: "Start a Business" },
    { icon: TrendingUp, label: "Business Funding" },
  ];
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-panel)]/40">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-500">Best for people looking to</p>
        <div className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-5">
          {goals.map((g) => (
            <div key={g.label} className="card flex flex-col items-center gap-2 p-4 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-white">
                <g.icon size={20} />
              </div>
              <span className="text-xs font-medium text-slate-200">{g.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Guarantee() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <div className="card glow flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl gold-gradient text-black">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-white">Our promise to you</h3>
          <p className="mt-1 text-slate-300">
            No contracts and no games. You stay month-to-month and cancel anytime. We earn your business every
            single round by doing the work and showing you the results in your portal. If we're not producing,
            you walk — simple as that.
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "How fast will I see results?", a: "Most clients start seeing items removed and score movement within 45–90 days, with the best results in the 3–6 month range. It depends on your specific report." },
    { q: "What can you remove?", a: "We challenge collections, charge-offs, late payments, repossessions, inquiries, and public records that are inaccurate, outdated, or unverifiable. It doesn't matter what you owe — if it can't be verified, it can be removed." },
    { q: "Do I have to sign a long contract?", a: "No. We work month-to-month. No long-term contracts, and you can cancel anytime." },
    { q: "Is this legal?", a: "Yes. You have rights under the Fair Credit Reporting Act (FCRA) to dispute inaccurate or unverifiable information. We simply enforce those rights with proven strategies." },
    { q: "What if I'm thinking about bankruptcy?", a: "Talk to me first. In many cases we can remove enough negative items that bankruptcy isn't necessary. Call (689) 325-6649 before you file." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t border-[var(--color-line)] bg-[var(--color-panel)]/40">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-3xl font-black text-white sm:text-4xl">Questions, answered</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left"
              >
                <span className="font-semibold text-white">{f.q}</span>
                <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="px-4 pb-4 text-sm text-slate-300">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-20 text-center">
      <h2 className="text-3xl font-black text-white sm:text-5xl">
        Your credit. Your future. <span className="gold-text">Our mission.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
        Get your free credit analysis today and see exactly what's holding you back — and the plan to fix it.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <CTA className="text-lg" />
        <a href="tel:6893256649" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-6 py-4 font-semibold text-white hover:bg-white/5">
          <Phone size={17} className="text-sky-400" /> (689) 325-6649
        </a>
      </div>
      <p className="mt-5 text-sm text-slate-500">Discreet. Professional. Effective. · Faith-Driven. Results-Focused.</p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
        <Logo size={34} />
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} JV Credit Repair Services · Orlando, FL · We Repair Credit. We Restore Lives.
        </p>
        <Link href="/dashboard" className="text-xs text-slate-500 hover:text-white">
          Team Login →
        </Link>
      </div>
    </footer>
  );
}
