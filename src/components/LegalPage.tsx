import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

// Shared shell for /terms, /privacy and /about.
export function LegalPage({
  title,
  updated,
  draft = false,
  children,
}: {
  title: string;
  updated?: string;
  draft?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="bg-[var(--bg)] text-[var(--fg)]">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
          {draft && (
            <div
              role="note"
              className="mb-8 rounded-[var(--r-md)] border border-[var(--need-fg)]/30 bg-[var(--need-bg)] px-4 py-3 text-sm font-semibold text-[var(--need-fg)]"
            >
              Draft, pending legal review. This page is a plain language
              placeholder and is not yet final.
            </div>
          )}
          <h1 className="text-[36px] sm:text-[44px] font-bold leading-[1.08] tracking-[-0.03em]">
            {title}
          </h1>
          {updated && (
            <p className="mt-3 text-sm text-[var(--fg-subtle)]">
              Last updated {updated}
            </p>
          )}
          <div className="legal-body mt-8 space-y-6 text-[16px] leading-relaxed text-[var(--fg-muted)] [&_h2]:mt-10 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:tracking-[-0.015em] [&_h2]:text-[var(--fg)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:font-semibold [&_a]:text-[var(--accent-text)] [&_a:hover]:underline [&_strong]:text-[var(--fg)]">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function TodoContact() {
  return (
    <span>
      <a href="mailto:info@loopfounders.com">info@loopfounders.com</a>{" "}
      <mark className="rounded bg-[var(--need-bg)] px-1 text-[var(--need-fg)]">
        TODO: confirm contact address before launch
      </mark>
    </span>
  );
}
