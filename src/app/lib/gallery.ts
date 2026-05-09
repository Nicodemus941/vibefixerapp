// F.A.S.T. work gallery — configured here, rendered by /components/Gallery.tsx.
//
// HOW TO ADD A PHOTO:
//   1. Drop the file into /public/img/  (e.g. /public/img/gallery-camry.jpg)
//   2. Add a new entry to GALLERY below with:
//        - src: the public path
//        - alt: short ALT text for screen readers (what's literally in the photo)
//        - caption: 4-8 word badge shown over the image
//        - tag: "install" | "rig" | "team" | "before-after"
//   3. Save. Done — the section renders the new photo automatically.
//
// HONESTY RULE: Only real F.A.S.T. photos. No stock images pretending to be
// the team. Trust is the whole game for a local family service business.
//
// BEFORE/AFTER ENTRIES:
//   For paired before/after photos, set `pair: { before: "...", after: "..." }`
//   instead of `src`. The Gallery renders these as a side-by-side comparison.
//   Tag should be "before-after".

export type GalleryItem =
  | {
      kind: "single";
      src: string;
      alt: string;
      caption: string;
      tag: "install" | "rig" | "team";
    }
  | {
      kind: "pair";
      before: string;
      after: string;
      alt: string;
      caption: string;
      tag: "before-after";
    };

export const GALLERY: readonly GalleryItem[] = [
  {
    kind: "single",
    src: "/img/gallery-work-1.jpg",
    alt: "Eric in a F.A.S.T. cap and blue gloves performing a windshield repair under a tent",
    caption: "Chip repair · North Port driveway",
    tag: "install",
  },
  {
    kind: "single",
    src: "/img/gallery-work-2.jpg",
    alt: "Eric's sons setting a new windshield onto a black Toyota 4Runner in a customer driveway",
    caption: "4Runner full windshield · driveway install",
    tag: "install",
  },
  {
    kind: "single",
    src: "/img/gallery-van.jpg",
    alt: "F.A.S.T. Family Autoglass branded mobile trailer parked next to a customer SUV being serviced",
    caption: "The rig pulls up to your driveway",
    tag: "rig",
  },
  {
    kind: "single",
    src: "/img/eric-working.jpg",
    alt: "Eric drilling a chip on a customer windshield, F.A.S.T. branded cap on",
    caption: "Drilling depth · no shortcuts",
    tag: "install",
  },
  // Add more entries here ↑.
  // Eric: when you have before/after photos, drop them in /public/img/ and add:
  //   {
  //     kind: "pair",
  //     before: "/img/civic-before.jpg",
  //     after: "/img/civic-after.jpg",
  //     alt: "2018 Honda Civic windshield: spider crack repaired",
  //     caption: "2018 Civic · spider crack → fixed",
  //     tag: "before-after",
  //   },
];
