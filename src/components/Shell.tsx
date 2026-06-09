"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileSearch,
  Target,
  ScrollText,
  MessagesSquare,
  CheckSquare,
  Workflow,
  UserCircle,
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";
import { Logo } from "./Logo";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/analysis", label: "AI Credit Analysis", icon: FileSearch },
  { href: "/gameplan", label: "Goal Game Plan", icon: Target },
  { href: "/disputes", label: "Dispute Engine", icon: ScrollText },
  { href: "/communications", label: "Messages", icon: MessagesSquare },
  { href: "/tasks", label: "Tasks & Reminders", icon: CheckSquare },
  { href: "/automations", label: "Automations", icon: Workflow },
  { href: "/portal", label: "Client Portal", icon: UserCircle },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5 border-b border-[var(--color-line)]">
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "brand-gradient text-white font-semibold glow"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-[var(--color-line)]">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
          <img
            src="/jonathan.svg"
            alt="Jonathan Velez"
            className="h-9 w-9 rounded-full ring-2 ring-sky-500/40"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Jonathan Velez</div>
            <div className="text-[11px] text-slate-400">Owner / CEO</div>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] italic text-slate-500">
          “Faith-Driven. Results-Focused.”
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-grid">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 glass lg:block">{SidebarInner}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 glass">{SidebarInner}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink)]/80 px-4 py-3 backdrop-blur lg:px-8">
          <button className="lg:hidden text-slate-300" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="relative hidden flex-1 max-w-md md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search clients, disputes, documents…"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-dot" />
              All systems live
            </span>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-line)] text-slate-300 hover:text-white">
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
            </button>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <div key={pathname} className="page-anim">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
