"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, Search, Sparkles } from "lucide-react";

const TABS = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/matches", label: "Matches", icon: Sparkles },
  { href: "/inbox", label: "Inbox", icon: Inbox },
] as const;

// Routes where the tab bar would fight with a sticky bottom UI (the
// message composer on a thread page). Hide it there so the composer can
// sit flush at the bottom — that's the conventional messaging-app shape.
function shouldHide(pathname: string): boolean {
  if (pathname.startsWith("/inbox/") && pathname !== "/inbox") return true;
  if (pathname === "/login") return true;
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname === "/") return true;
  return false;
}

export function MobileTabBar() {
  const pathname = usePathname() ?? "";
  if (shouldHide(pathname)) return null;

  return (
    <>
      {/* Spacer so the last item in a scrollable page isn't hidden
          behind the fixed tab bar. Block-level so it takes flow space.
          md:hidden mirrors the bar itself. */}
      <div
        aria-hidden
        className="md:hidden"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
      />
      <nav
        aria-label="Primary navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md safe-bottom"
      >
      <ul className="mx-auto max-w-2xl px-2 grid grid-cols-4 gap-1 pt-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/feed"
              ? pathname === "/feed" || pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
                <Icon
                  className={["h-5 w-5", active ? "" : ""].join(" ")}
                  strokeWidth={active ? 2.4 : 2}
                />
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
