function timeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MessageBubble({
  body,
  createdAt,
  isMine,
}: {
  body: string;
  createdAt: string;
  isMine: boolean;
}) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
          isMine
            ? "bg-[var(--accent)] text-[var(--bg)] rounded-br-md"
            : "bg-[var(--surface-2)] text-[var(--fg)] border border-[var(--border)] rounded-bl-md",
        ].join(" ")}
      >
        <p>{body}</p>
        <p
          className={[
            "mt-1 font-mono text-[10px] tabular-nums",
            isMine ? "text-[var(--bg)]/70 text-right" : "text-[var(--fg-subtle)]",
          ].join(" ")}
        >
          {timeShort(createdAt)}
        </p>
      </div>
    </div>
  );
}
