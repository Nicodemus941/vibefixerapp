const STATS = [
  { k: "5.0★", v: "Birdeye rating · 26 reviews" },
  { k: "7 days", v: "Direct physician access / week" },
  { k: "Same-day", v: "Appointments — guaranteed" },
  { k: "0 NPs", v: "Every visit is with the physician" },
];

export default function SocialProof() {
  return (
    <section className="border-y border-white/10 bg-black/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.k} className="p-6 text-center sm:p-8">
            <div className="text-2xl sm:text-3xl font-black text-[var(--gold)]">
              {s.k}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-white/70">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
