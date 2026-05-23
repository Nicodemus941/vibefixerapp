"use client";
import { useState } from "react";

export function PhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  if (!photos.length) {
    return (
      <div className="ak-card flex aspect-[4/3] items-center justify-center text-sm text-[var(--color-ink-muted)]">
        No photos
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="ak-card aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active]}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {photos.slice(0, 10).map((p, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`overflow-hidden rounded-md border-2 ${
                i === active
                  ? "border-[var(--color-brand)]"
                  : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p}
                alt=""
                className="aspect-[4/3] h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
