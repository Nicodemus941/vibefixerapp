export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[820px] rounded-full bg-[var(--gold)] opacity-[0.10] blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
          Last call
        </p>
        <h2 className="mt-3 font-black uppercase leading-[0.9] tracking-tight text-5xl sm:text-7xl lg:text-8xl">
          Stop driving to
          <br />
          <span className="text-[var(--gold)]">a clinic.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
          For the price of your last surprise ER bill, you can have a real
          doctor on your phone — every day, for a year.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#book"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-8 py-4 text-base font-black uppercase tracking-wider text-black hover:bg-[var(--gold-bright)] transition shadow-[0_18px_60px_-20px_rgba(212,175,55,0.7)]"
          >
            Apply for Membership →
          </a>
          <a
            href="tel:+14076637447"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-bold uppercase tracking-wider text-white hover:border-[var(--gold)] hover:text-[var(--gold)] transition"
          >
            Or call (407) 663-7447
          </a>
        </div>
        <p className="mt-6 text-xs text-white/55">
          30-day money-back promise · Month-to-month · No contracts
        </p>
      </div>
    </section>
  );
}
