import Link from "next/link";
import { LoopMark } from "@/components/LoopMark";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] overflow-x-hidden">
      <header
        className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-1)]/90 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            href="/feed"
            aria-label="Loop home"
            className="inline-flex min-h-11 items-center gap-2 text-lg font-bold tracking-[-0.02em] rounded-lg"
          >
            <LoopMark />
            Loop
          </Link>
          <Link
            href="/feed"
            className="press-shrink inline-flex h-11 items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 text-sm font-semibold text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
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
