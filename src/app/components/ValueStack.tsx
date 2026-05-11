const STACK = [
  { label: "Direct physician cell — 7 days / wk", value: 6000 },
  { label: "Unlimited same-day visits (~24 / yr)", value: 4800 },
  { label: "In-home & office visits", value: 3600 },
  { label: "Telemedicine, video + text", value: 1800 },
  { label: "Annual functional medicine intake", value: 1500 },
  { label: "Hormone & metabolic workup", value: 1200 },
  { label: "Aesthetics credit + member pricing", value: 1000 },
  { label: "Travel medicine + worldwide telemed", value: 800 },
];

export default function ValueStack() {
  const total = STACK.reduce((s, x) => s + x.value, 0);

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
            Here’s what you actually get
          </p>
          <h2 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            ${total.toLocaleString()}+ in care.
            <br />
            <span className="text-[var(--gold)]">From $500/mo.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <ul className="divide-y divide-white/5">
              {STACK.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)] text-xs">
                      ✓
                    </span>
                    <span className="text-sm sm:text-base">{row.label}</span>
                  </div>
                  <span className="shrink-0 text-sm sm:text-base font-bold text-white/85 tabular-nums">
                    ${row.value.toLocaleString()}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-4 pt-4 mt-1">
                <span className="text-sm font-bold uppercase tracking-widest text-white/60">
                  Total yearly value
                </span>
                <span className="text-2xl font-black text-[var(--gold)] tabular-nums">
                  ${total.toLocaleString()}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 pt-3">
                <span className="text-base font-bold">
                  Membership starting at
                </span>
                <span className="text-3xl font-black tabular-nums">
                  $6,000<span className="text-base font-medium text-white/55">/yr</span>
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-3xl border border-[var(--gold)]/40 bg-gradient-to-b from-[var(--gold)]/[0.18] to-transparent p-6 sm:p-7">
              <h3 className="text-xl font-black uppercase tracking-tight">
                Our 30-day promise
              </h3>
              <p className="mt-2 text-sm text-white/80">
                Try Elite for 30 days. If we don’t change how you feel about
                healthcare, we’ll refund your first month — no questions, no
                friction.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
                <Shield /> Risk-free guarantee
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <h3 className="text-xl font-black uppercase tracking-tight">
                HSA / FSA friendly
              </h3>
              <p className="mt-2 text-sm text-white/75">
                Most membership components qualify. We provide an itemized
                superbill every month — your accountant will thank you.
              </p>
            </div>
            <a
              href="#book"
              className="inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-6 py-4 text-base font-black uppercase tracking-wider text-black hover:bg-[var(--gold-bright)] transition"
            >
              Lock in this month’s rate →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Shield() {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}
