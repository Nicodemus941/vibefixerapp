import Link from "next/link";
import { LoopMark } from "./LoopMark";

// Public marketing header (landing, about, terms, privacy).
export function SiteHeader({
  sections = [],
}: {
  sections?: { href: string; label: string }[];
}) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <nav
        aria-label="Primary"
        className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3"
      >
        <Link
          href="/"
          aria-label="Loop home"
          className="inline-flex min-h-11 items-center gap-2 text-lg font-bold tracking-[-0.02em] text-[var(--fg)] rounded-lg"
        >
          <LoopMark />
          Loop
        </Link>

        {sections.length > 0 && (
          <ul className="hidden md:flex items-center gap-1">
            {sections.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="inline-flex h-10 items-center px-3.5 rounded-full text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-1)] transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/login"
            className="inline-flex h-11 items-center px-3 sm:px-4 rounded-full text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="press-shrink inline-flex h-11 items-center px-4 sm:px-5 rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] transition-colors"
          >
            Join free
          </Link>
        </div>
      </nav>
    </header>
  );
}
