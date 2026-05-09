import { BUSINESS } from "../config";

const STEPS = [
  {
    n: "01",
    title: "Tap call or text",
    body: "Tell us your year, make, model, and what's broken. We give you an honest answer in under 5 minutes.",
    icon: (
      <path
        fill="currentColor"
        d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z"
      />
    ),
  },
  {
    n: "02",
    title: "We confirm insurance or quote cash",
    body: "If you have comprehensive insurance, we file the claim for you. Cash? You'll get a transparent flat quote — no surprises.",
    icon: (
      <path
        fill="currentColor"
        d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z"
      />
    ),
  },
  {
    n: "03",
    title: "We come to you",
    body: "Home, office, or even the parking lot at lunch. We install in 60–90 minutes. You go on with your day.",
    icon: (
      <path
        fill="currentColor"
        d="M3 7.5C3 6.12 4.12 5 5.5 5h13C19.88 5 21 6.12 21 7.5V13a2.52 2.52 0 0 1-1.07 2.07l-3.43 2.4a3.5 3.5 0 0 1-2 .61H9.5a3.5 3.5 0 0 1-2-.61l-3.43-2.4A2.52 2.52 0 0 1 3 13V7.5Z"
      />
    ),
  },
];

export default function Process() {
  return (
    <section id="how" className="relative bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-trust/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-trust">
            How it works
          </span>
          <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
            Three steps. <span className="underline-amber">No waiting room.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-muted">
            From cracked glass to crystal clear without ever leaving your home or office.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="relative flex flex-col rounded-2xl border border-line bg-bone p-7"
            >
              <div className="flex items-center justify-between">
                <span className="text-5xl font-extrabold tracking-tight text-ink/10">
                  {step.n}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-amber">
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    {step.icon}
                  </svg>
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{step.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-ink-muted">
          Call before <span className="font-semibold text-ink">{BUSINESS.cutoffTime}</span> for next-day install.
          Most chip repairs <span className="font-semibold text-ink">same day</span>.
        </p>
      </div>
    </section>
  );
}
