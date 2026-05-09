import { BUSINESS } from "../config";

export default function Story() {
  return (
    <section id="story" className="relative overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
              Family-owned · Father & sons
            </span>
            <h2 className="headline mt-5 text-3xl font-extrabold sm:text-5xl">
              You're not just another appointment.{" "}
              <span className="underline-amber">You're family.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-white/75">
              We started F.A.S.T. because we were tired of seeing neighbors get
              jerked around by big-box auto glass shops — overcharged, oversold,
              and stuck in waiting rooms for half a day.
            </p>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              {BUSINESS.yearsExperience}+ years in the trade. A father and his sons.
              One promise: we treat your car like our own — because the next windshield
              we replace might be your kid riding shotgun.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Jobs done right", `${BUSINESS.yearsExperience}+ yrs`],
                ["Service area", "North Port + nearby"],
                ["Family promise", "Treat you like ours"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber">
                    {k}
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-white">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual: stylized family card stack */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto aspect-[4/5] max-w-md">
              <div className="absolute -left-2 top-6 h-[92%] w-[92%] rotate-[-4deg] rounded-3xl bg-amber/20 ring-1 ring-amber/30" />
              <div className="absolute right-0 bottom-0 h-[92%] w-[92%] rotate-[3deg] rounded-3xl bg-white/5 ring-1 ring-white/10" />
              <div className="relative flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-7 ring-1 ring-white/10 backdrop-blur-md">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber text-ink">
                      <svg viewBox="0 0 24 24" className="h-6 w-6">
                        <path
                          fill="currentColor"
                          d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5Z"
                        />
                      </svg>
                    </span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                        The promise
                      </div>
                      <div className="text-lg font-extrabold">
                        Don't cry over broken glass —
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold leading-tight">
                    just call the family that's <span className="underline-amber">FAST</span>.
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5 text-sm text-white/85">
                  {[
                    "We pick up the phone — even on weekends",
                    "We show up when we said we would",
                    "We stand behind every install",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-amber">
                        <path
                          fill="currentColor"
                          d="m9.55 17.6-5.3-5.3 1.42-1.42 3.88 3.88 8.78-8.78L19.75 7.4 9.55 17.6Z"
                        />
                      </svg>
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs">
                  <div>
                    <div className="font-bold uppercase tracking-wider text-amber">
                      Local
                    </div>
                    <div className="text-white/70">{BUSINESS.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold uppercase tracking-wider text-amber">
                      Owners
                    </div>
                    <div className="text-white/70">Dad &amp; the boys</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
