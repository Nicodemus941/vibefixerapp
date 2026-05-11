"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "#services", label: "Services" },
  { href: "#membership", label: "Membership" },
  { href: "#doctors", label: "Doctors" },
  { href: "#results", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/85 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gold)] text-black font-black">
            E
          </span>
          <span className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-bold uppercase tracking-[0.18em]">
              Elite Medical
            </span>
            <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold)]">
              Concierge · Orlando
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-white/80 hover:text-[var(--gold)] transition"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="tel:+14076637447"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-semibold hover:border-[var(--gold)] hover:text-[var(--gold)] transition"
            aria-label="Call now"
          >
            <PhoneIcon /> <span>(407) 663-7447</span>
          </a>
          <a
            href="#book"
            className="inline-flex items-center rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-bold text-black hover:bg-[var(--gold-bright)] transition shadow-[0_8px_24px_-12px_rgba(212,175,55,0.7)]"
          >
            Become a Member
          </a>
          <button
            aria-label="Open menu"
            className="md:hidden ml-1 grid h-9 w-9 place-items-center rounded-full border border-white/15"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <div className="flex flex-col gap-[3px]">
              <span
                className={`h-[2px] w-4 bg-white transition ${
                  open ? "translate-y-[5px] rotate-45" : ""
                }`}
              />
              <span
                className={`h-[2px] w-4 bg-white transition ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-[2px] w-4 bg-white transition ${
                  open ? "-translate-y-[5px] -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-black/95 px-4 pb-4 pt-2">
          <nav className="flex flex-col">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium text-white/90 border-b border-white/5"
              >
                {n.label}
              </a>
            ))}
            <a
              href="tel:+14076637447"
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-semibold"
            >
              <PhoneIcon /> (407) 663-7447
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
