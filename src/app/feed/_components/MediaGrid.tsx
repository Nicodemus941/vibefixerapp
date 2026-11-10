"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { publicMediaUrl, type PostMedia } from "@/lib/post-media";
import { FOCUS_RING, Modal } from "./Modal";

// 1 image: natural aspect (clamped). 2: side by side. 3: one tall + two
// stacked. 4: 2x2. Each tile opens the lightbox.
export function MediaGrid({ media, authorName }: { media: PostMedia[]; authorName: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (media.length === 0) return null;

  const items = media.slice(0, 4);
  const altFor = (m: PostMedia, i: number) =>
    m.alt?.trim() || `Image ${i + 1} of ${items.length} from ${authorName}`;

  const tile = (m: PostMedia, i: number, extra: string) => (
    <button
      key={m.path}
      type="button"
      onClick={() => setOpen(i)}
      aria-label={`Open image ${i + 1} of ${items.length}`}
      className={`group relative block overflow-hidden bg-[var(--surface-3)] ${extra} ${FOCUS_RING}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={publicMediaUrl(m.path)}
        alt={altFor(m, i)}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
    </button>
  );

  let grid: React.ReactNode;
  if (items.length === 1) {
    const m = items[0];
    const ratio = m.width && m.height ? Math.min(Math.max(m.width / m.height, 0.8), 2) : 4 / 3;
    grid = (
      <div className="overflow-hidden rounded-xl" style={{ aspectRatio: String(ratio) }}>
        {tile(m, 0, "h-full w-full")}
      </div>
    );
  } else if (items.length === 2) {
    grid = (
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl aspect-[2/1]">
        {items.map((m, i) => tile(m, i, "h-full w-full"))}
      </div>
    );
  } else if (items.length === 3) {
    grid = (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl aspect-[4/3]">
        {tile(items[0], 0, "row-span-2 h-full w-full")}
        {tile(items[1], 1, "h-full w-full")}
        {tile(items[2], 2, "h-full w-full")}
      </div>
    );
  } else {
    grid = (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl aspect-square sm:aspect-[4/3]">
        {items.map((m, i) => tile(m, i, "h-full w-full"))}
      </div>
    );
  }

  return (
    <>
      <div className="mt-3">{grid}</div>
      <Lightbox
        media={items}
        index={open}
        onIndex={setOpen}
        altFor={altFor}
      />
    </>
  );
}

function Lightbox({
  media,
  index,
  onIndex,
  altFor,
}: {
  media: PostMedia[];
  index: number | null;
  onIndex: (i: number | null) => void;
  altFor: (m: PostMedia, i: number) => string;
}) {
  const count = media.length;
  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndex((index + delta + count) % count);
    },
    [index, count, onIndex],
  );

  useEffect(() => {
    if (index === null || count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, count, go]);

  // Basic swipe on touch screens.
  const [touchX, setTouchX] = useState<number | null>(null);

  const current = index !== null ? media[index] : null;

  return (
    <Modal
      open={index !== null}
      onClose={() => onIndex(null)}
      title={index !== null ? `Image ${index + 1} of ${count}` : "Image"}
      variant="fullscreen"
      labelHidden
    >
      {current && index !== null && (
        <div
          className="relative flex h-full w-full items-center justify-center bg-black"
          onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchX === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            setTouchX(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicMediaUrl(current.path)}
            alt={altFor(current, index)}
            className="max-h-full max-w-full object-contain"
          />
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous image"
                className={`press-shrink absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 ${FOCUS_RING}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next image"
                className={`press-shrink absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 ${FOCUS_RING}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <p
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-xs text-white tabular-nums safe-bottom"
                aria-live="polite"
              >
                {index + 1} / {count}
              </p>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
