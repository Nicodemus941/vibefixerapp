import { BUSINESS } from "../config";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-spotlight py-20 text-white sm:py-28">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
          Stop putting it off
        </span>
        <h2 className="headline mt-5 text-4xl font-extrabold sm:text-6xl">
          Don't cry over broken glass.{" "}
          <span className="underline-amber">Just call the family that's FAST.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/75">
          One call. Free quote in 60 seconds. We come to you, handle your insurance,
          and get you back on the road safely — usually by tomorrow.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`tel:${BUSINESS.phoneDial}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber px-7 py-5 text-base font-extrabold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold sm:w-auto sm:text-lg"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z" />
            </svg>
            Call {BUSINESS.phoneDisplay}
          </a>
          <a
            href="/quote"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-7 py-5 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto sm:text-lg"
          >
            Get my free quote
          </a>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          {[
            "Mobile · we come to you",
            "Insurance handled · $0 most plans",
            "Family-owned · 15+ yrs",
          ].map((line) => (
            <div
              key={line}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-white/80"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber">
                <path
                  fill="currentColor"
                  d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                />
              </svg>
              {line}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
