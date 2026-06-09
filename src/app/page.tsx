import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  Home,
  Car,
  Building2,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FileSearch,
  ScrollText,
  MessagesSquare,
  Workflow,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-grid">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Link
          href="/dashboard"
          className="rounded-lg brand-gradient px-4 py-2 text-sm font-semibold text-white glow"
        >
          Open Command Center
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
              <Sparkles size={13} /> In Business Since 2018 · Faith-Driven
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] text-white sm:text-5xl">
              We Repair Credit.
              <br />
              We <span className="gold-text">Restore Lives.</span>
            </h1>
            <p className="mt-5 max-w-md text-slate-300">
              The all-in-one operating system for JV Credit Repair Services. Upload a report, let AI
              build the analysis and game plan, fire off custom dispute letters, and manage every
              client from lead to graduation — in one branded platform.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg brand-gradient px-5 py-3 font-semibold text-white glow"
              >
                Enter Dashboard <ArrowRight size={17} />
              </Link>
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-5 py-3 font-semibold text-slate-200 hover:bg-white/5"
              >
                View Client Portal
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> Results in 45–90 days
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-sky-400" /> Discreet. Professional.
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="card fade-up p-7 glow">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Sign in to your workspace</div>
                <div className="text-xs text-slate-400">Owner & staff access</div>
              </div>
              <img src="/jonathan.svg" alt="" className="h-10 w-10 rounded-full ring-2 ring-sky-500/40" />
            </div>
            <label className="mb-1 block text-xs text-slate-400">Email</label>
            <input
              defaultValue="jonathan@jvcreditrepair.com"
              className="mb-4 w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:border-sky-500/50 focus:outline-none"
            />
            <label className="mb-1 block text-xs text-slate-400">Password</label>
            <input
              type="password"
              defaultValue="••••••••••"
              className="mb-5 w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:border-sky-500/50 focus:outline-none"
            />
            <Link
              href="/dashboard"
              className="block rounded-lg brand-gradient py-3 text-center font-semibold text-white glow"
            >
              Sign In
            </Link>
            <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-3 text-center text-[11px] text-amber-200/90">
              Demo mode — click <b>Sign In</b> to explore the full platform. No real data is used.
            </div>
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <p className="mb-4 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
          Built for every client goal
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { icon: Home, label: "Buy a Home" },
            { icon: Car, label: "Buy a Car" },
            { icon: Building2, label: "Rent Apartment" },
            { icon: Sparkles, label: "Start Business" },
            { icon: TrendingUp, label: "Business Funding" },
          ].map((g) => (
            <div key={g.label} className="card flex flex-col items-center gap-2 p-4 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-xl brand-gradient">
                <g.icon size={20} className="text-white" />
              </div>
              <span className="text-xs font-medium text-slate-200">{g.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileSearch, title: "AI Report Analysis", desc: "Upload the PDF — get a detailed, emailed credit analysis in seconds." },
            { icon: ScrollText, title: "Atomic Dispute Letters", desc: "Unique, strategy-driven letters built for maximum deletions." },
            { icon: MessagesSquare, title: "Text & Email Built-in", desc: "Reach clients by SMS and email directly inside the software." },
            { icon: Workflow, title: "Done-for-you Automations", desc: "Onboarding, follow-ups, and 30-day reminders run themselves." },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-sky-500/10 text-sky-300">
                <f.icon size={19} />
              </div>
              <div className="font-semibold text-white">{f.title}</div>
              <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--color-line)] py-8 text-center text-xs text-slate-500">
        JV Credit Repair Services · Orlando, FL · (689) 325-6649 · Your Credit. Your Future. Our Mission.
      </footer>
    </div>
  );
}
