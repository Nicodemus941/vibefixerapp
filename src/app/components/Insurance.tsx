const CARRIERS = [
  "GEICO",
  "Progressive",
  "State Farm",
  "Allstate",
  "USAA",
  "Liberty Mutual",
  "Farmers",
  "Nationwide",
];

export default function Insurance() {
  return (
    <section className="relative bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
              Insurance, handled
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              You don't lift{" "}
              <span className="underline-amber">a finger.</span>
            </h2>
            <p className="mt-5 text-lg text-ink-muted">
              We file your claim, talk to your adjuster, send the paperwork.
              In Florida, comprehensive coverage usually means $0 out-of-pocket
              on a windshield replacement — and we make that easy.
            </p>

            <ul className="mt-7 space-y-3 text-[15px]">
              {[
                "Free claim filing — we do the calls for you",
                "Most comprehensive plans cover replacement at $0",
                "Cash quotes available — flat, transparent, no markup",
                "We give you the answer in under 5 minutes",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                      <path
                        fill="currentColor"
                        d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                      />
                    </svg>
                  </span>
                  <span className="text-ink">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-line bg-bone p-8">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                Carriers we work with every week
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CARRIERS.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-center rounded-xl border border-line bg-white px-3 py-4 text-center text-sm font-bold tracking-tight text-ink"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-ink-muted">
                Don't see your carrier? We probably still work with them. Call us — we'll check in 60 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
