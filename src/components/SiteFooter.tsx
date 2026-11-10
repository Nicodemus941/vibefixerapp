import Link from "next/link";
import { LoopMark } from "./LoopMark";

// Public site footer (landing, about, terms, privacy). Ink band in both themes.
export function SiteFooter() {
  const year = new Date().getFullYear();
  const links = [
    { href: "/about", label: "About" },
    { href: "/jobs", label: "Jobs" },
    { href: "/discover", label: "Discover" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ];
  return (
    <footer className="bg-[var(--ink)] text-[var(--fg-on-ink-muted)] border-t border-[var(--ink-border)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-lg font-bold tracking-[-0.02em] text-white">
            <LoopMark color="#3FD39A" />
            Loop
          </span>
          <span className="text-[13px]">
            © {year} Loop. A free network for people who build.
          </span>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-1 gap-y-1 text-[13px]">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 items-center px-2.5 rounded-lg hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
