import { BUSINESS } from "../config";

export default function Logo({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const fg = tone === "paper" ? "text-white" : "text-ink";
  const accent = "text-amber";
  return (
    <a href="/" className={`group inline-flex items-center gap-2.5 ${fg}`}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber text-ink shadow-pop">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 7.5C3 6.12 4.12 5 5.5 5h13C19.88 5 21 6.12 21 7.5v6.92c0 .82-.4 1.6-1.07 2.07l-3.43 2.4a3.5 3.5 0 0 1-2 .61H9.5a3.5 3.5 0 0 1-2-.61l-3.43-2.4A2.52 2.52 0 0 1 3 14.42V7.5Zm2 0V14l3 2.1c.27.18.58.28.9.28h6.2c.32 0 .63-.1.9-.28L19 14V7.5a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5Z"
          />
          <path
            fill="currentColor"
            opacity=".55"
            d="m6 7 1.6 5.5a1 1 0 0 0 .96.73h6.88a1 1 0 0 0 .96-.73L18 7H6Z"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-extrabold tracking-tight">
          F.A.S.T.<span className={`ml-1 ${accent}`}>·</span> Family Autoglass
        </span>
        <span className={`text-[10.5px] font-medium tracking-[0.18em] uppercase ${tone === "paper" ? "text-white/55" : "text-ink-muted"}`}>
          {BUSINESS.city} · Mobile service
        </span>
      </span>
    </a>
  );
}
