export default function Pain() {
  const items = [
    {
      x: "3-week waits for a 7-minute visit.",
      w: "Same-day appointments. As long as you need.",
    },
    {
      x: "“The doctor will call you back.” (They won’t.)",
      w: "Your physician’s direct cell. Answered 7 days a week.",
    },
    {
      x: "Seen by a different NP every time.",
      w: "One physician. The same physician. Every visit.",
    },
    {
      x: "$3,400 surprise bill from a 4-minute lab.",
      w: "Flat monthly membership. No surprise charges. Ever.",
    },
    {
      x: "“Everything looks normal.” It isn’t.",
      w: "Functional medicine + executive physical that actually finds it.",
    },
    {
      x: "Sick? Drive 40 min and sit in a waiting room.",
      w: "We come to your home or office. Or you skip the lobby.",
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
            Healthcare in America is broken
          </p>
          <h2 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            You don’t need <span className="text-stroke">more healthcare.</span>
            <br /> You need{" "}
            <span className="text-[var(--gold)]">better access.</span>
          </h2>
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="divide-y divide-white/10">
            {items.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x sm:divide-white/10"
              >
                <div className="flex items-start gap-3 p-5 sm:p-6">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-300">
                    ✕
                  </span>
                  <p className="min-w-0 text-white/70 line-through decoration-rose-400/50">
                    {row.x}
                  </p>
                </div>
                <div className="flex items-start gap-3 border-t border-white/10 p-5 sm:border-t-0 sm:p-6">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)]">
                    ✓
                  </span>
                  <p className="min-w-0 font-semibold">{row.w}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
