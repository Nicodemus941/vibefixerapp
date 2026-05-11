const LOGOS = [
  "Forbes Health",
  "Orlando Magazine",
  "Winter Park Voice",
  "Wall Street Journal",
  "Men's Health",
  "Vogue Wellness",
  "Goop",
  "South Florida Living",
];

export default function PressStrip() {
  return (
    <section
      aria-label="As featured in"
      className="relative border-y border-white/10 bg-gradient-to-b from-black via-[#0a0908] to-black py-7 sm:py-9"
    >
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/45">
          As trusted by patients featured in
        </p>
        <div className="mt-4 overflow-hidden">
          <div className="flex w-max gap-10 sm:gap-14 animate-marquee whitespace-nowrap">
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <span
                key={i}
                className="text-base sm:text-lg font-semibold uppercase tracking-[0.18em] text-white/45 hover:text-white/80 transition"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
