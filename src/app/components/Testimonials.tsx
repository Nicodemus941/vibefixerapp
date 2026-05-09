// Testimonials sourced verbatim from fastfamilyautoglass.com/testimonial.
// "Eric" is the owner. Customers wrote these themselves — wording is exact.
const REVIEWS = [
  {
    name: "Jessica",
    body:
      "Eric came to my office and repaired my windshield. Not only did he come to my office so I could continue to work, he also vacuumed my car out. Top Notch Service!!",
  },
  {
    name: "Evan",
    body:
      "Eric and his sons came and serviced my vehicle in my driveway and the work was just Phenomenal!",
  },
  {
    name: "Nick",
    body:
      "Eric was amazing and very informative from start to finish! I am only using his company from here on out.",
  },
  {
    name: "Ashley",
    body:
      "F.A.S.T Family Autoglass goes above and beyond for their customers. Eric the owner was on top of my windshield replacement from the moment he answered the phone. Repair was done the next day!",
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
  const initial = name[0]?.toUpperCase() ?? "?";
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber to-amber-bold text-base font-extrabold text-ink">
      {initial}
    </span>
  );
}

export default function Testimonials() {
  return (
    <section id="reviews" className="relative bg-bone py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
              Real words from real customers
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              People talk about{" "}
              <span className="underline-amber">Eric.</span>
            </h2>
            <p className="mt-4 text-ink-muted">
              These are the exact words our customers wrote — not paid, not edited.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-card">
            <Stars />
            <div>
              <div className="text-lg font-extrabold leading-tight">5.0 from neighbors</div>
              <div className="text-xs text-ink-muted">North Port &amp; nearby</div>
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
                  <div className="text-xs text-ink-muted">Verified customer</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-ink-muted">
          More reviews on{" "}
          <a
            href="https://www.facebook.com/fastfamilyautoglass"
            target="_blank"
            rel="noopener"
            className="font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4"
          >
            Facebook
          </a>
          .
        </p>
      </div>
    </section>
  );
}
