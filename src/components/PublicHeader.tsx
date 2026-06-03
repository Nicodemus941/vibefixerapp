import Link from "next/link";

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
      <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Loop home"
          className="press-shrink flex items-center gap-2 shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loop-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
          <span className="font-semibold tracking-tight">Loop</span>
        </Link>
        <Link
          href={href}
          className="press-shrink inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-[var(--bg)] hover:brightness-110"
        >
          {label}
        </Link>
      </div>
    </header>
  );
}
