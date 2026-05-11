const REVIEWS = [
  {
    quote:
      "Monica and Richard are the best doctors I've ever met. Extremely knowledgeable, responsive, and genuinely caring.",
    name: "Daniel R.",
    role: "Signature Member · 3 yrs",
    initials: "DR",
  },
  {
    quote:
      "We moved down from Ohio and were used to concierge medicine — Dr. Monica and Dr. Richard take it to a new level. The service is extraordinary.",
    name: "The Bennett Family",
    role: "Black Card Members",
    initials: "BF",
  },
  {
    quote:
      "When I wasn't feeling well, Dr. Sher immediately diagnosed the issue and guided me through the right plan. A doctor who is both highly skilled and truly cares is invaluable.",
    name: "Jessica L.",
    role: "Member · 2 yrs",
    initials: "JL",
  },
  {
    quote:
      "Called at 7am with a kid's earache. House visit by 9. I have never paid less for medicine that worked more.",
    name: "Marcus T.",
    role: "Essential Member",
    initials: "MT",
  },
  {
    quote:
      "I'd been told ‘everything looks normal' for 4 years. They ran the right labs and found exactly what was wrong. Life-changing.",
    name: "Priya K.",
    role: "Signature Member",
    initials: "PK",
  },
  {
    quote:
      "Texting my own physician on a Sunday and getting a real answer in 6 minutes is a thing of beauty.",
    name: "Adam S.",
    role: "Black Card Member",
    initials: "AS",
  },
];

export default function Testimonials() {
  return (
    <section
      id="results"
      className="relative overflow-hidden py-20 sm:py-28 bg-gradient-to-b from-black to-[#0d0c0a]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
              5.0★ on Birdeye · 26 reviews · still counting
            </p>
            <h2 className="mt-2 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
              What members say
              <br />
              when nobody’s watching.
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} />
            ))}
            <span className="ml-2 text-sm font-bold text-white/80">
              5.0 / 5.0
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-[var(--gold)]/30 transition"
            >
              <div className="flex items-center gap-1 text-[var(--gold)]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} small />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-white/85">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gold)]/15 text-xs font-black text-[var(--gold)]">
                  {r.initials}
                </span>
                <div>
                  <div className="text-sm font-bold">{r.name}</div>
                  <div className="text-[11px] uppercase tracking-widest text-white/55">
                    {r.role}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Star({ small = false }: { small?: boolean }) {
  const s = small ? 14 : 18;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[var(--gold)]"
    >
      <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.8 5.7 21.2l1.7-7L2 9.5l7.1-.6L12 2z" />
    </svg>
  );
}
