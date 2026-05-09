import Image from "next/image";
import { BUSINESS } from "../config";

const TEAM = [
  {
    name: "Eric",
    role: "Owner · Lead installer",
    src: "/img/eric-working.jpg",
    quote: "Picks up the phone. Shows up himself.",
  },
  {
    name: "Kyle",
    role: "Installer",
    src: "/img/kyle.jpg",
    quote: "Same training. Same standards.",
  },
  {
    name: "Damian",
    role: "Installer",
    src: "/img/damian.jpg",
    quote: "Same family. Same care.",
  },
];

export default function TeamStrip() {
  return (
    <section className="relative bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-end gap-8 sm:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
              The crew on your driveway
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              Real people. <span className="underline-amber">Real hands.</span>
            </h2>
            <p className="mt-4 max-w-md text-ink-muted">
              When the truck rolls up, this is who's doing the work. No
              subcontractors. No call-center middlemen. Just Eric and his sons.
            </p>
          </div>
          <div className="hidden items-end justify-end sm:flex">
            <div className="rounded-2xl border border-line bg-bone p-5 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
                Family-owned
              </div>
              <div className="mt-1 text-base font-extrabold text-ink">
                {BUSINESS.yearsExperience}+ years on Florida glass.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TEAM.map((m) => (
            <figure
              key={m.name}
              className="group relative overflow-hidden rounded-3xl border border-line bg-bone shadow-card"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={m.src}
                  alt={`${m.name} — ${m.role}`}
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 90vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent p-5 pt-14 text-white">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-ink">
                      {m.name}
                    </span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                      {m.role}
                    </span>
                  </div>
                  <figcaption className="mt-2 text-sm font-semibold leading-snug">
                    &ldquo;{m.quote}&rdquo;
                  </figcaption>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
