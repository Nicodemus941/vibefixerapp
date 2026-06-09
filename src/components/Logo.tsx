export function LogoMark({ size = 44, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={animated ? "logo-pop" : undefined}
      style={{ filter: "drop-shadow(0 6px 16px rgba(31,157,255,0.35))" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="jvBadge" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2aa7ff" />
          <stop offset="0.55" stopColor="#1273e6" />
          <stop offset="1" stopColor="#0a4fb0" />
        </linearGradient>
        <linearGradient id="jvGold" x1="10" y1="34" x2="40" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8b73e" />
          <stop offset="0.5" stopColor="#ffe49b" />
          <stop offset="1" stopColor="#e8b73e" />
        </linearGradient>
        <linearGradient id="jvGloss" x1="24" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Badge */}
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#jvBadge)" />
      <rect x="2" y="2" width="44" height="22" rx="13" fill="url(#jvGloss)" />
      <rect x="2.6" y="2.6" width="42.8" height="42.8" rx="12.4" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.2" />

      {/* Rising-score arrow (gold) */}
      <path
        className={animated ? "logo-arrow" : undefined}
        d="M11 31 L19 25 L25 28 L37 16"
        stroke="url(#jvGold)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31.5 15.4 L37.4 15 L37 20.9"
        stroke="url(#jvGold)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* JV monogram */}
      <text
        x="24"
        y="41.5"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, Arial"
        fontWeight="900"
        fontSize="15"
        letterSpacing="0.5"
        fill="#ffffff"
      >
        JV
      </text>
    </svg>
  );
}

export function Logo({
  size = 44,
  showText = true,
  animated = true,
}: {
  size?: number;
  showText?: boolean;
  animated?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} animated={animated} />
      {showText && (
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-wide">
            <span className="text-white">JV CREDIT</span> <span className="gold-text">REPAIR</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Services</div>
        </div>
      )}
    </div>
  );
}
