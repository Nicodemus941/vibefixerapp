import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] relative isolate overflow-x-hidden">
      {/* Ambient mesh — same vibe as the landing hero, dialed down */}
      <div className="mesh-bg absolute inset-0 -z-10 opacity-50" aria-hidden />
      <div className="grain absolute inset-0 -z-10" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--bg)] to-transparent -z-10"
        aria-hidden
      />

      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            href="/feed"
            aria-label="Loop home"
            className="flex items-center gap-2 press-shrink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/loop-mark.svg"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="font-semibold tracking-tight">Loop</span>
          </Link>
          <Link
            href="/feed"
            className="press-shrink inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
          >
            Skip for now
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 pt-8 sm:pt-12 pb-12 sm:pb-16 safe-bottom">
        {children}
      </main>
    </div>
  );
}
