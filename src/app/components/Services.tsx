const SERVICES = [
  {
    tag: "Primary & Urgent",
    title: "Same-day primary care.",
    body: "Sick visits, infections, injuries, refills, work / school physicals. Seen today — by a physician, not a triage nurse.",
    eta: "Today",
    icon: "🩺",
  },
  {
    tag: "In-Home Visits",
    title: "We come to you.",
    body: "Home, hotel, or office. Ideal for new babies, post-op recovery, busy executives, or anyone done with waiting rooms.",
    eta: "Door-to-door",
    icon: "🏠",
  },
  {
    tag: "Telemedicine",
    title: "Video & text with your doctor.",
    body: "Refills, follow-ups, second opinions, travel guidance. Your physician’s direct line — seven days a week.",
    eta: "≤ 15 min",
    icon: "📱",
  },
  {
    tag: "Executive Physical",
    title: "The exam most doctors skip.",
    body: "Advanced cardiac markers, hormone panels, cancer screening, body composition, lifestyle plan. One half-day. Zero loose ends.",
    eta: "Half day",
    icon: "🧬",
  },
  {
    tag: "Functional Medicine",
    title: "Root-cause, not pill-cause.",
    body: "Gut, hormones, sleep, inflammation, micronutrients. We find why you feel off — and fix the upstream cause.",
    eta: "Ongoing",
    icon: "🌱",
  },
  {
    tag: "Hormone Therapy",
    title: "BHRT, TRT & optimization.",
    body: "Personalized protocols for energy, sleep, libido, recovery, and body composition — overseen by a board-certified MD.",
    eta: "12-wk cycle",
    icon: "⚡",
  },
  {
    tag: "Weight Management",
    title: "Medical weight loss & GLP-1.",
    body: "Semaglutide / tirzepatide with physician oversight, side-effect support, labs, and nutrition coaching included.",
    eta: "12 wk avg",
    icon: "⚖️",
  },
  {
    tag: "Aesthetics",
    title: "Tox, filler & Accufit body contouring.",
    body: "Subtle, surgeon-grade aesthetics performed by a physician. Plus Accufit — the FDA-cleared muscle-toning treatment.",
    eta: "30–45 min",
    icon: "✨",
  },
  {
    tag: "Stem Cell & Joint",
    title: "Regenerative & joint injections.",
    body: "Image-guided injections, regenerative therapies, and PRP for knees, shoulders, and back. Get out of pain — without surgery.",
    eta: "45 min",
    icon: "🦴",
  },
  {
    tag: "Allergy & Sleep",
    title: "Allergy testing + sleep consults.",
    body: "In-office allergy testing, immunotherapy guidance, and structured sleep evaluations with a real treatment plan.",
    eta: "60 min",
    icon: "😴",
  },
  {
    tag: "Travel Medicine",
    title: "Pre-trip + in-trip telehealth.",
    body: "Vaccines, prescriptions, travel-ready labs, and 24/7 telemedicine while you’re abroad. Never trip-blind again.",
    eta: "2 weeks pre-trip",
    icon: "✈️",
  },
  {
    tag: "Chronic Disease",
    title: "Diabetes, BP, cholesterol, thyroid.",
    body: "Tight, personal management of the big-4 chronic conditions — with the kind of follow-up insurance medicine cannot afford.",
    eta: "Ongoing",
    icon: "❤️",
  },
];

import Image from "next/image";
import { IMG } from "../lib/images";

export default function Services() {
  return (
    <section id="services" className="relative overflow-hidden py-20 sm:py-28">
      <Image
        src={IMG.stethoscope}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="absolute inset-0 -z-10 object-cover opacity-[0.06]"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-[#0a0908] to-black"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
              What we treat
            </p>
            <h2 className="mt-2 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
              Everything a clinic does.
              <br />
              <span className="text-[var(--gold)]">Without the clinic.</span>
            </h2>
          </div>
          <a
            href="#book"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold hover:border-[var(--gold)] hover:text-[var(--gold)] transition"
          >
            Talk to a doctor →
          </a>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <article
              key={s.tag}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 hover:border-[var(--gold)]/40 hover:from-[var(--gold)]/[0.07] transition"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--gold)]/15 text-2xl">
                  {s.icon}
                </span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                  {s.eta}
                </span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--gold)]">
                {s.tag}
              </p>
              <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {s.body}
              </p>
              <a
                href="#book"
                className="mt-5 inline-flex items-center text-sm font-bold text-[var(--gold)] opacity-80 group-hover:opacity-100"
              >
                Learn more →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
