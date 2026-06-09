// Splits text into words that reveal in a staggered, blurred lift.
// `start` continues the stagger index across multiple <Words> groups.
export function Words({
  text,
  start = 0,
  className = "",
}: {
  text: string;
  start?: number;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className={`word ${className}`}
          style={{ ["--wi" as string]: String(start + i) } as React.CSSProperties}
        >
          {w}
        </span>
      ))}
    </>
  );
}
