import Link from "next/link";
import { LoopMark } from "./LoopMark";

// Slim header used on routes that are public to anonymous visitors
// (e.g. /jobs, /jobs/[id], /o/[slug]). The authenticated FeedHeader
// is shown to signed-in users instead.
export function PublicHeader({
  nextPath = "/",
  label = "Sign in",
}: {
  nextPath?: string;
  label?: string;
}) {
  const href = nextPath === "/" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`;
  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Loop home"
          className="press-shrink inline-flex min-h-11 items-center gap-2 shrink-0 text-lg font-bold tracking-[-0.02em] rounded-lg"
        >
          <LoopMark />
          Loop
        </Link>
        <Link
          href={href}
          className="press-shrink inline-flex items-center justify-center rounded-full bg-[var(--accent)] h-11 px-5 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
        >
          {label}
        </Link>
      </div>
    </header>
  );
}
