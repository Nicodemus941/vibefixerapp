const FAQS = [
  {
    q: "Do you take insurance?",
    a: "Our membership fee covers your physician’s time and is not billed to insurance. We still recommend you maintain insurance for labs, imaging, ER, hospital stays, and specialist referrals. Most patients use HSA/FSA — we provide itemized superbills.",
  },
  {
    q: "Will I see a doctor or a nurse practitioner?",
    a: "Always a physician. We do not delegate care to NPs or PAs. Every visit is with Dr. Monica or Dr. Richard Sher.",
  },
  {
    q: "What does same-day really mean?",
    a: "We block protected same-day slots every weekday. You text or call, we schedule that day. Most members are seen within 2–4 hours. In-home if you’d prefer.",
  },
  {
    q: "Can I really text my doctor?",
    a: "Yes. You get your physician’s direct cell number after enrollment. Members text us all the time — for refills, follow-ups, second opinions, even abroad.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No. Memberships are month-to-month. Cancel any time without penalty. We earn your business every 30 days.",
  },
  {
    q: "What happens if I'm sick on a weekend?",
    a: "Saturday or Sunday — we still answer the phone. Your physician is on call seven days a week for members. ER coordination if you ever need it.",
  },
  {
    q: "Where are you located?",
    a: "1201 South Orlando Ave, Suite 132, Maitland, FL 32751 — just north of Winter Park. We see members in our office, on telemedicine, or in-home throughout greater Orlando.",
  },
  {
    q: "Can I add family members?",
    a: "Yes — discounted couples and family pricing is available. Call (407) 663-7447 and we’ll structure it for you.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
            Common questions
          </p>
          <h2 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            We've heard them all.
          </h2>
        </div>

        <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
          {FAQS.map((f, i) => (
            <details key={i} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 sm:p-6">
                <span className="text-base sm:text-lg font-bold pr-2">
                  {f.q}
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 transition group-open:rotate-45 group-open:border-[var(--gold)] group-open:text-[var(--gold)]">
                  +
                </span>
              </summary>
              <p className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-white/75">
                {f.a}
              </p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-white/60">
          Still have a question?{" "}
          <a
            href="tel:+14076637447"
            className="font-bold text-[var(--gold)] hover:underline"
          >
            Call (407) 663-7447
          </a>{" "}
          — a human (and the same one) picks up.
        </p>
      </div>
    </section>
  );
}
