export function Logo({ size = 40, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid place-items-center rounded-xl brand-gradient glow shrink-0"
        style={{ width: size, height: size }}
      >
        <span
          className="font-black tracking-tight text-white"
          style={{ fontSize: size * 0.42, lineHeight: 1 }}
        >
          JV
        </span>
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 rounded-full gold-gradient"
          style={{ width: size * 0.5 }}
        />
      </div>
      {showText && (
        <div className="leading-tight">
          <div className="font-extrabold text-[15px] tracking-wide">
            <span className="text-white">CREDIT</span>{" "}
            <span className="gold-text">REPAIR</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Services</div>
        </div>
      )}
    </div>
  );
}
