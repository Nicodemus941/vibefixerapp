import type { ReactNode } from "react";

// Cover band for profile, company and group pages. Shows the uploaded
// cover image, or the brand gradient when there is none.
export function CoverBand({
  url,
  alt,
  className = "h-32 sm:h-48",
  children,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="cover-fallback absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
