import { BUSINESS } from "../config";

const SERVICES = [
  {
    eyebrow: "Most common",
    title: "Rock chip & crack repair",
    price: "Often $0 with insurance",
    bullets: [
      "Stop a small chip before it spreads",
      "30 minutes — done in your driveway",
      "Most repairs covered with no deductible",
    ],
    badge: "Same day",
  },
  {
    eyebrow: "Full replacement",
    title: "Windshield replacement",
    price: "Insurance-approved · cash quotes available",
    bullets: [
      "OEM-quality glass · proper urethane bond",
      "60–90 minutes + safe-drive-away time",
      `Call by ${BUSINESS.cutoffTime} for next-day install`,
    ],
    badge: "Featured",
    featured: true,
  },
  {
    eyebrow: "Side & back glass",
    title: "Door, vent & rear glass",
    price: "Free quote — call or text",
    bullets: [
      "Broken side window? We seal it & replace it",
      "Cleanup of any glass debris included",
      "Mobile install — no shop visit needed",
    ],
    badge: "Mobile",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative bg-bone py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
              What we fix
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              Mobile auto glass,{" "}
              <span className="underline-amber">done right.</span>
            </h2>
          </div>
          <p className="max-w-md text-ink-muted">
            Three services. One promise: we come to you, we do it right, and we don't leave until you're happy.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className={`group relative flex flex-col rounded-3xl p-7 transition ${
                s.featured
                  ? "bg-ink text-white shadow-pop ring-1 ring-amber/40"
                  : "border border-line bg-white hover:-translate-y-0.5 hover:shadow-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                    s.featured ? "text-amber" : "text-amber-bold"
                  }`}
                >
                  {s.eyebrow}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider ${
                    s.featured
                      ? "bg-amber text-ink"
                      : "bg-ink/5 text-ink-muted"
                  }`}
                >
                  {s.badge}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">{s.title}</h3>
              <p className={`mt-1.5 text-sm ${s.featured ? "text-white/70" : "text-ink-muted"}`}>
                {s.price}
              </p>

              <ul className={`mt-6 space-y-3 text-sm ${s.featured ? "text-white/85" : "text-ink"}`}>
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        s.featured ? "text-amber" : "text-amber-bold"
                      }`}
                    >
                      <path
                        fill="currentColor"
                        d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                      />
                    </svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-2.5">
                <a
                  href="/quote"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                    s.featured
                      ? "bg-amber text-ink hover:bg-amber-bold"
                      : "bg-ink text-white hover:bg-ink-soft"
                  }`}
                >
                  Get a free quote
                </a>
                <a
                  href={`tel:${BUSINESS.phoneDial}`}
                  className={`inline-flex items-center justify-center gap-2 text-sm font-semibold ${
                    s.featured ? "text-white/85 hover:text-white" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  or call {BUSINESS.phoneDisplay}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
