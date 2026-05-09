// NOTE: These are placeholder testimonials. Replace with real Google reviews
// once available — keep the same shape (name, location, body, vehicle).
const REVIEWS = [
  {
    name: "Maria T.",
    location: "North Port, FL",
    vehicle: "2021 Toyota RAV4",
    body:
      "Called at 9 AM. Truck was in my driveway by 11. Done before lunch. They called my insurance and I never had to deal with it. This is how it should be.",
  },
  {
    name: "Brandon W.",
    location: "Port Charlotte, FL",
    vehicle: "2018 F-150",
    body:
      "Got a quote from Safelite that was insane. F.A.S.T. came out, did it for less, used good glass, and the bond is rock solid 6 months later. Highly recommend.",
  },
  {
    name: "Janelle R.",
    location: "Venice, FL",
    vehicle: "2023 Honda Pilot",
    body:
      "I work nights. They came out at 7 AM on a Saturday — at MY house — so I didn't lose a day. These guys actually mean it when they say family.",
  },
  {
    name: "Carlos M.",
    location: "Englewood, FL",
    vehicle: "2019 Civic",
    body:
      "Rock chip turned into a crack overnight. Texted them a photo. Repaired by dinner. $0 with my insurance. Saved me a $700 replacement.",
  },
];

function Stars() {
  return (
    <div className="flex items-center gap-0.5" aria-label="Five stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 text-amber">
          <path
            fill="currentColor"
            d="m12 17.27 5.18 3.14-1.37-5.88L20.5 9.6l-6.04-.51L12 3.5 9.54 9.09l-6.04.51 4.69 4.93-1.37 5.88L12 17.27Z"
          />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber to-amber-bold text-sm font-extrabold text-ink">
      {initials}
    </span>
  );
}

export default function Testimonials() {
  return (
    <section id="reviews" className="relative bg-bone py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-bold">
              What our customers say
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              Real reviews from{" "}
              <span className="underline-amber">real neighbors.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-card">
            <Stars />
            <div>
              <div className="text-lg font-extrabold leading-tight">5.0 rating</div>
              <div className="text-xs text-ink-muted">based on local reviews</div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {REVIEWS.map((r) => (
            <figure
              key={r.name}
              className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-card"
            >
              <Stars />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">
                &ldquo;{r.body}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <Avatar name={r.name} />
                <div>
                  <div className="text-sm font-bold">{r.name}</div>
                  <div className="text-xs text-ink-muted">
                    {r.location} · {r.vehicle}
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
