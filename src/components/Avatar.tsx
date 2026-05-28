// Server-renderable. Renders the user's uploaded photo if present,
// otherwise the first-letter initial on a colored circle.

const SIZES = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-2xl",
  xl: "h-16 w-16 text-2xl",
} as const;

export function Avatar({
  name,
  url,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  url: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initial = (name?.[0] ?? "?").toUpperCase();
  const sizeClass = SIZES[size];
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className={`${sizeClass} shrink-0 rounded-full object-cover bg-[var(--surface-3)] ${className ?? ""}`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center font-mono text-[var(--fg-muted)] ${className ?? ""}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
