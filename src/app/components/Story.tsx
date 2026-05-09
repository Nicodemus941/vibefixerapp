import Image from "next/image";
import { BUSINESS } from "../config";

export default function Story() {
  return (
    <section id="story" className="relative overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-amber/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
              Meet the family · Eric, Kyle &amp; Damian
            </span>
            <h2 className="headline mt-5 text-3xl font-extrabold sm:text-5xl">
              You're not just another appointment.{" "}
              <span className="underline-amber">You're family.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              F.A.S.T. is run by Eric and his sons Kyle and Damian — a{" "}
              {BUSINESS.yearsExperience}+ year auto-glass family right here in{" "}
              {BUSINESS.city}. When you call, you reach Eric. When the truck
              pulls up, it's Eric, Kyle, or Damian.
            </p>
            <p className="mt-4 max-w-xl text-lg text-white/80">
              We started this because we were tired of seeing neighbors jerked
              around by big-box shops. One promise: we treat your car like our
              own — because the next windshield we replace might be your kid
              riding shotgun.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Years in trade", `${BUSINESS.yearsExperience}+`],
                ["Service area", "North Port + nearby"],
                ["Owner-on-the-job", "Every visit"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-brand">
                    {k}
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-white">{v}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-2 pr-5">
              <span className="rounded-xl bg-amber px-4 py-2.5 text-sm font-extrabold text-ink">
                Tap to call Eric
              </span>
              <a
                href={`tel:${BUSINESS.phoneDial}`}
                className="text-sm font-bold text-white hover:text-amber"
              >
                {BUSINESS.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Real family photo, framed honestly */}
          <div className="relative lg:col-span-6">
            <div className="relative mx-auto max-w-lg">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-brand/30 via-amber/20 to-transparent blur-xl" aria-hidden />
              <div className="relative overflow-hidden rounded-3xl border-2 border-amber/40 bg-white p-2 shadow-pop">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src="/img/family.jpg"
                    alt="The F.A.S.T. Family Autoglass family — Eric with his wife and sons Kyle and Damian"
                    fill
                    sizes="(min-width: 1024px) 560px, 90vw"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-3 text-ink">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-brand-deep">
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        <path
                          fill="currentColor"
                          d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5Z"
                        />
                      </svg>
                    </span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-brand-deep">
                        The team
                      </div>
                      <div className="text-sm font-extrabold">
                        Eric, Kyle &amp; Damian
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full bg-amber px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-ink">
                    Family-owned
                  </div>
                </div>
              </div>

              {/* Floating quote anchor */}
              <div className="absolute -bottom-6 -left-4 hidden max-w-[15rem] rotate-[-4deg] rounded-2xl bg-white p-4 text-ink shadow-pop ring-1 ring-amber/40 sm:block">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-bold">
                  The promise
                </div>
                <p className="mt-1 text-sm font-extrabold leading-tight">
                  Don't cry over broken glass — just call the family that's{" "}
                  <span className="underline-amber">FAST</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
