"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, Search, Sparkles, User } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  // True when the tab should match nested routes via prefix match.
  // False for things like /feed that should only match exactly (and the
  // landing /).
  prefix?: boolean;
};

const BASE_TABS: Tab[] = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Browse", icon: Search, prefix: true },
  { href: "/matches", label: "Matches", icon: Sparkles, prefix: true },
  { href: "/inbox", label: "Inbox", icon: Inbox, prefix: true },
];

// Hide the bar on routes where a sticky bottom UI would conflict (the
// inbox thread composer), or on routes that are owned screens with their
// own chrome (login, onboarding, landing).
function shouldHide(pathname: string): boolean {
  if (pathname.startsWith("/inbox/") && pathname !== "/inbox") return true;
  if (pathname === "/login") return true;
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname === "/") return true;
  return false;
}

export function MobileTabBar({ userId }: { userId?: string }) {
  const pathname = usePathname() ?? "";
  if (shouldHide(pathname)) return null;

  const tabs: Tab[] = userId
    ? [...BASE_TABS, { href: `/u/${userId}`, label: "Me", icon: User, prefix: false }]
    : BASE_TABS;

  return (
    <>
      {/* Spacer so the last item in a scrollable page isn't hidden
          behind the fixed tab bar. */}
      <div
        aria-hidden
        className="md:hidden"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
      />
      <nav
        aria-label="Primary navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md safe-bottom"
      >
        <ul
          className={[
            "mx-auto max-w-2xl px-2 grid gap-1 pt-1.5",
            tabs.length === 5 ? "grid-cols-5" : "grid-cols-4",
          ].join(" ")}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              tab.href === "/feed"
                ? pathname === "/feed" || pathname === "/"
                : tab.prefix
                ? pathname === tab.href || pathname.startsWith(`${tab.href}/`)
                : pathname === tab.href;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "press-shrink flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5",
                    active
                      ? "text-[var(--accent)]"
                      : "text-[var(--fg-subtle)] hover:text-[var(--fg)]",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
