import Link from "next/link";
import Logo from "../components/Logo";
import { logout } from "./login/actions";

export default function TopBar({ mockMode }: { mockMode: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-ink text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo tone="paper" />
          <span className="hidden rounded-full bg-amber px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-ink sm:inline">
            Cockpit
          </span>
          {mockMode ? (
            <span className="rounded-full border border-white/25 bg-white/5 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white/80">
              Demo data
            </span>
          ) : null}
        </div>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <Link
            href="/admin"
            className="rounded-lg px-3 py-1.5 text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Today
          </Link>
          <Link
            href="/admin/inbox"
            className="rounded-lg px-3 py-1.5 text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Inbox
          </Link>
          <Link
            href="/admin/calendar"
            className="rounded-lg px-3 py-1.5 text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Calendar
          </Link>
          <Link
            href="/"
            className="hidden rounded-lg px-3 py-1.5 text-white/85 transition hover:bg-white/10 hover:text-white sm:inline-block"
          >
            Site ↗
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
