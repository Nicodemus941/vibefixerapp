import Image from "next/image";
import { BUSINESS } from "../config";

export default function Logo({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const fg = tone === "paper" ? "text-white" : "text-ink";
  const subFg = tone === "paper" ? "text-white/60" : "text-ink-muted";
  return (
    <a href="/" className={`group inline-flex items-center gap-3 ${fg}`}>
      <span
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ${
          tone === "paper" ? "bg-white ring-white/20" : "bg-white ring-line"
        }`}
      >
        <Image
          src="/img/logo.jpg"
          alt="F.A.S.T. Family Autoglass"
          width={88}
          height={88}
          className="h-9 w-9 object-contain"
          priority
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-extrabold tracking-tight">
          F.A.S.T.<span className="ml-1 text-brand">·</span> Family Autoglass
        </span>
        <span className={`mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] ${subFg}`}>
          {BUSINESS.city} · Mobile service
        </span>
      </span>
    </a>
  );
}
