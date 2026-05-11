export default function StickyMobileCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-white/10 bg-black/90 p-3 backdrop-blur md:hidden">
      <a
        href="tel:+14076637447"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-3 text-sm font-bold text-white"
      >
        Call now
      </a>
      <a
        href="#book"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-4 py-3 text-sm font-black uppercase text-black"
      >
        Book Visit
      </a>
    </div>
  );
}
