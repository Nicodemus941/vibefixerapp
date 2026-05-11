import Image from "next/image";
import { IMG } from "../lib/images";

export default function Doctors() {
  return (
    <section
      id="doctors"
      className="relative overflow-hidden py-20 sm:py-28"
    >
      <Image
        src={IMG.officeInterior}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="absolute inset-0 -z-10 object-cover opacity-[0.08]"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-black/95 to-black"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-[var(--gold)]/30 via-transparent to-white/5 blur-2xl" />
            <div className="relative grid grid-cols-2 gap-3 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur">
              <DocCard
                src={IMG.drMonicaSilhouette}
                name="Dr. Monica Sher"
                role="Internal Medicine · Board-Certified"
                school="American Univ. of Integrative Sciences"
                residency="Oak Hill Hospital · Chief Medical Resident"
              />
              <DocCard
                src={IMG.drRichardSilhouette}
                name="Dr. Richard Sher"
                role="Internal Medicine · Board-Certified"
                school="Husband. Co-founder. Patient-first."
                residency="Decades of concierge experience"
              />
              <div className="col-span-2 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/[0.06] p-5 text-sm text-white/85">
                <p className="font-bold text-white">
                  The husband-and-wife team Maitland actually trusts.
                </p>
                <p className="mt-1 text-white/70">
                  Decades of combined experience in concierge medicine. Every
                  visit is with a physician — never a nurse practitioner, never
                  a PA, never a stranger.
                </p>
              </div>
            </div>
          </div>

          <div id="founder">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
              Meet your doctors
            </p>
            <h2 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl">
              Real physicians.
              <br />
              <span className="text-[var(--gold)]">Real relationships.</span>
            </h2>

            <p className="mt-5 text-white/80">
              Dr. Monica Sher graduated from Florida Atlantic University, earned
              her MD at the American University of Integrative Sciences, and
              completed her Internal Medicine residency at Oak Hill Hospital,
              where she was selected as Chief Medical Resident. She is American
              Board–Certified in Internal Medicine.
            </p>
            <p className="mt-3 text-white/80">
              Together with her husband, Dr. Richard Sher, she founded Elite
              Medical Concierge to fix the one thing modern medicine got worst:{" "}
              <em className="text-white">access to your doctor.</em>
            </p>

            <ul className="mt-7 grid grid-cols-2 gap-3 text-sm">
              {[
                "Board-Certified Internal Medicine",
                "Chief Medical Resident",
                "Decades of concierge experience",
                "Functional medicine trained",
                "5★ on Birdeye · 26+ reviews",
                "Featured in local press",
              ].map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="mt-0.5 text-[var(--gold)]">★</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#book"
                className="inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black hover:bg-[var(--gold-bright)] transition"
              >
                Meet Dr. Sher →
              </a>
              <a
                href="tel:+14076637447"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:border-[var(--gold)] hover:text-[var(--gold)] transition"
              >
                Or call (407) 663-7447
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DocCard({
  src,
  name,
  role,
  school,
  residency,
}: {
  src: string;
  name: string;
  role: string;
  school: string;
  residency: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01]">
      <div className="relative aspect-[4/5]">
        <Image
          src={src}
          alt={`Portrait placeholder for ${name} — swap with real headshot`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/85" />
        <span className="absolute bottom-3 left-3 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">
          MD · Board-Certified
        </span>
      </div>
      <div className="p-4">
        <p className="text-base font-bold leading-tight">{name}</p>
        <p className="mt-0.5 text-xs text-white/65">{role}</p>
        <p className="mt-2 text-xs text-white/55">{school}</p>
        <p className="text-xs text-white/55">{residency}</p>
      </div>
    </div>
  );
}
