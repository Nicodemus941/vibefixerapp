import { BUSINESS, NAV } from "../config";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="relative bg-brand-ink text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo tone="paper" />
            <p className="mt-4 max-w-sm text-sm text-white/65">
              Family-owned mobile auto glass serving {BUSINESS.serviceArea}.
              We come to you — same-day repairs, next-day replacements, and we
              treat every customer like family.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`tel:${BUSINESS.phoneDial}`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-amber-bold"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z" />
                </svg>
                {BUSINESS.phoneDisplay}
              </a>
              <a
                href={`sms:${BUSINESS.phoneDial}?&body=${encodeURIComponent(BUSINESS.smsBody)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Text us
              </a>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
              Site
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a className="transition hover:text-white" href={n.href}>
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <a className="transition hover:text-white" href="/quote">
                  Get a free quote
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
              Contact
            </div>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li>
                <span className="block text-xs text-white/50">Phone</span>
                <a
                  href={`tel:${BUSINESS.phoneDial}`}
                  className="font-semibold text-white hover:text-amber"
                >
                  {BUSINESS.phoneDisplay}
                </a>
              </li>
              <li>
                <span className="block text-xs text-white/50">Email</span>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="font-semibold text-white hover:text-amber"
                >
                  {BUSINESS.email}
                </a>
              </li>
              <li>
                <span className="block text-xs text-white/50">Hours</span>
                <span className="font-semibold text-white">{BUSINESS.hours}</span>
              </li>
              <li>
                <span className="block text-xs text-white/50">Service area</span>
                <span className="font-semibold text-white">{BUSINESS.serviceArea}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} {BUSINESS.name}. Family-owned in {BUSINESS.city}.
          </div>
          <div>Mobile windshield repair &amp; replacement · We come to you.</div>
        </div>
      </div>
    </footer>
  );
}
