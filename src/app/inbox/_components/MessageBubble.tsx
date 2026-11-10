import type { ThreadOffer } from "../actions";

function timeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function money(n: number): string {
  return n >= 1000 ? `$${Number.isInteger(n / 1000) ? n / 1000 : (n / 1000).toFixed(1)}k` : `$${n}`;
}

function priceLine(o: ThreadOffer): string | null {
  if (o.price_min !== null && o.price_max !== null && o.price_max !== o.price_min)
    return `${money(o.price_min)} to ${money(o.price_max)}`;
  if (o.price_min !== null) return `From ${money(o.price_min)}`;
  if (o.price_max !== null) return `Up to ${money(o.price_max)}`;
  return null;
}

export function MessageBubble({
  body,
  createdAt,
  isMine,
  offer,
  senderName,
}: {
  body: string;
  createdAt: string;
  isMine: boolean;
  offer?: ThreadOffer | null;
  senderName?: string;
}) {
  const price = offer ? priceLine(offer) : null;
  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words",
          isMine
            ? "bg-[var(--accent)] text-[var(--fg-on-accent)] rounded-br-md"
            : "bg-[var(--surface-1)] text-[var(--fg)] border border-[var(--border)] shadow-[var(--shadow-1)] rounded-bl-md",
        ].join(" ")}
      >
        <p>{body}</p>
        <p
          className={[
            "mt-1 text-[11px] tabular-nums",
            isMine ? "text-[var(--fg-on-accent)]/80 text-right" : "text-[var(--fg-subtle)]",
          ].join(" ")}
        >
          {timeShort(createdAt)}
        </p>
      </div>
      {offer && (
        <aside
          aria-label={isMine ? "Your offer shown with this message" : `What ${senderName ?? "they"} can offer`}
          className="mt-1.5 w-full max-w-[80%] rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--offer-bg)] px-3.5 py-2.5"
        >
          <p className="text-[11px] font-semibold text-[var(--offer-fg)]">
            {isMine ? "Your offer, shown to them" : `${senderName ?? "They"} offers`}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--fg)] break-words">{offer.title}</p>
          <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
            {[offer.category, price].filter(Boolean).join(" · ")}
          </p>
        </aside>
      )}
    </div>
  );
}
