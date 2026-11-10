// Server-renderable. Renders the user's uploaded photo if present,
// otherwise initials on one of five soft brand tints (picked from the
// name so the same person always gets the same color).

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-24 w-24 text-3xl",
  "3xl": "h-32 w-32 text-4xl",
} as const;

const TINTS = ["--av-1", "--av-2", "--av-3", "--av-4", "--av-5"] as const;

export function initialsFor(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function tintFor(name: string | null | undefined): string {
  const s = name ?? "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `var(${TINTS[h % TINTS.length]})`;
}

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
      className={`${sizeClass} shrink-0 rounded-full flex items-center justify-center font-bold tracking-tight text-[var(--fg)] ${className ?? ""}`}
      style={{ background: tintFor(name) }}
      aria-hidden
    >
      {initialsFor(name)}
    </div>
  );
}
