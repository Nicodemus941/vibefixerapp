export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-black/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)] text-black font-black">
                E
              </span>
              <div>
                <div className="text-base font-black uppercase tracking-[0.18em]">
                  Elite Medical Concierge
                </div>
                <div className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold)]">
                  Maitland · Winter Park · Orlando
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-white/65">
              Husband-and-wife concierge medicine practice founded by Drs.
              Monica &amp; Richard Sher. Same-day visits, direct physician
              access, real medicine — minus the waiting room.
            </p>
            <a
              href="#book"
              className="mt-5 inline-flex items-center rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-bold text-black hover:bg-[var(--gold-bright)] transition"
            >
              Become a Member →
            </a>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/55">
              Visit us
            </p>
            <p className="mt-3 text-sm text-white/85">
              1201 South Orlando Ave
              <br />
              Suite 132
              <br />
              Maitland, FL 32751
            </p>
            <a
              href="https://maps.google.com/?q=1201+S+Orlando+Ave+Suite+132+Maitland+FL+32751"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center text-sm font-bold text-[var(--gold)] hover:underline"
            >
              Get directions →
            </a>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/55">
              Reach us
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="tel:+14076637447"
                  className="hover:text-[var(--gold)]"
                >
                  (407) 663-7447
                </a>
              </li>
              <li>
                <a
                  href="mailto:elitemedicalconcierge@gmail.com"
                  className="hover:text-[var(--gold)] break-all"
                >
                  elitemedicalconcierge@gmail.com
                </a>
              </li>
              <li className="text-white/65">Mon–Fri 8a–6p</li>
              <li className="text-white/65">Sat 9a–1p · Sun on-call</li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <Social label="Instagram" href="https://www.instagram.com/elite_medical_concierge/" path="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm5.25-2.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
              <Social label="Facebook" href="https://www.facebook.com/people/Elite-Medical-Concierge/61579127272025/" path="M13 22v-8h3l1-4h-4V7.5c0-1.1.4-2 2-2h2V2.2C16.5 2.1 15.4 2 14.1 2 11.4 2 9 3.7 9 7v3H6v4h3v8h4Z" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} Elite Medical Concierge. All rights
            reserved.
          </p>
          <p className="text-[11px] text-white/40">
            Membership covers your physician’s time and is not insurance. We
            are not contracted with any insurance plan.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Social({
  href,
  label,
  path,
}: {
  href: string;
  label: string;
  path: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 hover:text-[var(--gold)] hover:border-[var(--gold)] transition"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d={path} />
      </svg>
    </a>
  );
}
