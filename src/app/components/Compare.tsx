const ROWS: { label: string; emc: string | boolean; ins: string | boolean }[] = [
  { label: "Same-day appointments", emc: true, ins: false },
  { label: "Direct cell to your physician", emc: true, ins: false },
  { label: "Visits with a real MD (not NP/PA)", emc: true, ins: false },
  { label: "In-home visits", emc: true, ins: false },
  { label: "Telemedicine 7 days / week", emc: true, ins: false },
  { label: "Surprise out-of-pocket bills", emc: "Never", ins: "Frequent" },
  { label: "Time per visit", emc: "30–90 min", ins: "7 min" },
  { label: "Months to schedule a physical", emc: "0", ins: "2–6" },
  { label: "Functional & longevity workup", emc: true, ins: false },
  { label: "Cancel anytime", emc: true, ins: "N/A" },
];

export default function Compare() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
            Elite vs. the system
          </p>
          <h2 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            One column is going
            <br />
            <span className="text-[var(--gold)]">to surprise you.</span>
          </h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-white/10">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr] bg-white/[0.04]">
            <Cell head>What you actually get</Cell>
            <Cell head highlight>
              Elite Medical
            </Cell>
            <Cell head>Traditional Insurance</Cell>
            {ROWS.map((r, i) => (
              <Row key={i} row={r} alt={i % 2 === 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  row,
  alt,
}: {
  row: { label: string; emc: string | boolean; ins: string | boolean };
  alt: boolean;
}) {
  return (
    <>
      <Cell alt={alt}>{row.label}</Cell>
      <Cell alt={alt} highlight>
        {renderVal(row.emc, true)}
      </Cell>
      <Cell alt={alt}>{renderVal(row.ins, false)}</Cell>
    </>
  );
}

function renderVal(v: string | boolean, isEMC: boolean) {
  if (v === true)
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--gold)] font-bold">
        ✓ Yes
      </span>
    );
  if (v === false)
    return <span className="text-rose-300/80">— No</span>;
  return <span className={isEMC ? "font-bold text-white" : "text-white/65"}>{v}</span>;
}

function Cell({
  children,
  head = false,
  alt = false,
  highlight = false,
}: {
  children: React.ReactNode;
  head?: boolean;
  alt?: boolean;
  highlight?: boolean;
}) {
  const base =
    "px-4 sm:px-6 py-4 text-sm sm:text-base border-b border-white/5";
  const headCls = head
    ? "text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/55 bg-black/40"
    : "";
  const highlightCls = highlight ? "bg-[var(--gold)]/[0.06]" : "";
  const altCls = alt && !head ? "bg-white/[0.02]" : "";
  return (
    <div className={`${base} ${headCls} ${highlightCls} ${altCls}`}>
      {children}
    </div>
  );
}
