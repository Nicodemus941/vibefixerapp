const PAINS = [
  {
    title: "That crack is growing every day",
    body: "Florida heat + bumps in the road = a small chip that turns into a full-windshield crack. The longer you wait, the more it costs.",
  },
  {
    title: "Going to a shop wastes a half-day",
    body: "Drive in, sit in a waiting room, drive home. Every shop visit is 3+ hours of your life you don't get back.",
  },
  {
    title: "You shouldn't fight your insurance",
    body: "Filing a claim, finding the right paperwork, waiting on hold — that's a full second job most people don't want.",
  },
  {
    title: "Driving with a cracked windshield isn't safe",
    body: "Your windshield holds the roof up in a rollover and helps deploy your airbags. A bad windshield can fail when it matters most.",
  },
];

export default function PainStack() {
  return (
    <section className="relative bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-flame/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
            The hidden cost of waiting
          </span>
          <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
            What's a cracked windshield
            <br className="hidden sm:block" />
            <span className="underline-amber">really costing you?</span>
          </h2>
          <p className="mt-5 text-lg text-ink-muted">
            Most people put off the call. Here's what that costs them.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PAINS.map((p, i) => (
            <div
              key={p.title}
              className="group relative overflow-hidden rounded-2xl border border-line bg-bone p-6 transition hover:-translate-y-0.5 hover:border-flame/30 hover:shadow-card"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flame/10 text-flame">
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      fill="currentColor"
                      d="M12 2 1 21h22L12 2Zm0 6 7.5 13H4.5L12 8Zm-1 4v4h2v-4h-2Zm0 5v2h2v-2h-2Z"
                    />
                  </svg>
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Cost #{i + 1}
                  </div>
                  <h3 className="mt-1 text-lg font-bold">{p.title}</h3>
                  <p className="mt-2 text-sm text-ink-muted">{p.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-amber/30 bg-amber/10 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-semibold sm:text-xl">
              Good news: this is what we fix — fast, mobile, insurance-approved.
            </p>
            <a
              href="/quote"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-soft"
            >
              Get my free quote
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path fill="currentColor" d="M5 12h13l-4.3-4.3 1.4-1.4 6.7 6.7-6.7 6.7-1.4-1.4 4.3-4.3H5v-2Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
