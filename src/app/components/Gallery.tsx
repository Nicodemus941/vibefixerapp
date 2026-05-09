import Image from "next/image";
import { GALLERY, type GalleryItem } from "../lib/gallery";

const TAG_LABEL: Record<GalleryItem["tag"], string> = {
  install: "Install",
  rig: "The rig",
  team: "Team",
  "before-after": "Before / after",
};

function ItemCard({ item, priority }: { item: GalleryItem; priority?: boolean }) {
  if (item.kind === "pair") {
    return (
      <figure className="group relative overflow-hidden rounded-3xl border border-line bg-bone shadow-card">
        <div className="grid grid-cols-2">
          <div className="relative aspect-[4/5]">
            <Image
              src={item.before}
              alt={`Before: ${item.alt}`}
              fill
              sizes="(min-width: 1024px) 240px, 50vw"
              className="object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-flame/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Before
            </span>
          </div>
          <div className="relative aspect-[4/5]">
            <Image
              src={item.after}
              alt={`After: ${item.alt}`}
              fill
              sizes="(min-width: 1024px) 240px, 50vw"
              className="object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
              After
            </span>
          </div>
        </div>
        <figcaption className="flex items-center justify-between gap-3 px-5 py-4">
          <span className="text-sm font-semibold text-ink">{item.caption}</span>
          <span className="rounded-full bg-amber/15 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-amber-bold">
            {TAG_LABEL[item.tag]}
          </span>
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="group relative overflow-hidden rounded-3xl border border-line bg-bone shadow-card">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 90vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          priority={priority}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
          <span className="text-sm font-semibold leading-snug">{item.caption}</span>
          <span className="shrink-0 rounded-full bg-amber px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-ink">
            {TAG_LABEL[item.tag]}
          </span>
        </div>
      </div>
    </figure>
  );
}

export default function Gallery() {
  if (GALLERY.length === 0) return null;
  return (
    <section id="work" className="relative bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-end gap-6 sm:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
              Real jobs · real driveways
            </span>
            <h2 className="headline mt-4 text-3xl font-extrabold sm:text-5xl">
              Work we're <span className="underline-amber">proud of.</span>
            </h2>
            <p className="mt-4 max-w-md text-ink-muted">
              Mobile installs, customer vehicles, the family's branded rig.
              Every photo is real F.A.S.T. work — no stock, no marketing fakery.
            </p>
          </div>
          <div className="hidden justify-self-end sm:block">
            <div className="rounded-2xl border border-line bg-bone p-5 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep">
                Want yours featured?
              </div>
              <p className="mt-2 text-ink">
                We post fresh installs to the gallery weekly. Book a slot and
                you might be next.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY.map((item, i) => (
            <ItemCard
              key={item.kind === "pair" ? item.before : item.src}
              item={item}
              priority={i < 2}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
