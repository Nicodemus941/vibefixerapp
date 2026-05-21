"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BODY_TYPES, MAKES } from "@/lib/types";

type Decoded = {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  body?: string;
  drivetrain?: string;
  fuel?: string;
  transmission?: string;
};

export function SellForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [vin, setVin] = useState("");
  const [decoding, setDecoding] = useState(false);
  const [decoded, setDecoded] = useState<Decoded>({});
  const [form, setForm] = useState({
    year: "",
    make: "",
    model: "",
    trim: "",
    body_type: "",
    transmission: "",
    drivetrain: "",
    fuel_type: "",
    mileage: "",
    exterior_color: "",
    interior_color: "",
    condition: "Excellent",
    price: "",
    description: "",
    location_city: "",
    location_state: "",
    zip: "",
    photos: [] as string[],
    photoInput: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function decodeVin() {
    if (vin.length !== 17) {
      setErr("VIN must be 17 characters.");
      return;
    }
    setErr(null);
    setDecoding(true);
    try {
      const r = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`,
      );
      const j = await r.json();
      const map: Record<string, string> = {};
      for (const row of j.Results ?? []) {
        if (row.Variable && row.Value) map[row.Variable] = row.Value;
      }
      const d: Decoded = {
        year: map["Model Year"],
        make: map["Make"],
        model: map["Model"],
        trim: map["Trim"],
        body: map["Body Class"],
        drivetrain: map["Drive Type"],
        fuel: map["Fuel Type - Primary"],
        transmission: map["Transmission Style"],
      };
      setDecoded(d);
      setForm((f) => ({
        ...f,
        year: d.year ?? f.year,
        make: titleCase(d.make ?? f.make),
        model: titleCase(d.model ?? f.model),
        trim: d.trim ?? f.trim,
        body_type: normalizeBody(d.body) ?? f.body_type,
        drivetrain: d.drivetrain ?? f.drivetrain,
        fuel_type: d.fuel ?? f.fuel_type,
        transmission: d.transmission ?? f.transmission,
      }));
      setStep(1);
    } catch {
      setErr("Couldn't decode VIN — fill the details manually.");
      setStep(1);
    }
    setDecoding(false);
  }

  function addPhoto() {
    const url = form.photoInput.trim();
    if (!url) return;
    setForm((f) => ({ ...f, photos: [...f.photos, url], photoInput: "" }));
  }

  async function submit() {
    setErr(null);
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      router.push("/auth/sign-in?next=/sell");
      return;
    }
    const year = Number(form.year);
    const price = Number(form.price);
    const mileage = Number(form.mileage);
    if (!year || !form.make || !form.model || !price) {
      setErr("Year, make, model and price are required.");
      setSubmitting(false);
      return;
    }
    const title = `${year} ${form.make} ${form.model}${form.trim ? " " + form.trim : ""}`;
    const market = estimateMarket(year, mileage);
    const score = computeDealScore(price, market);
    const { data, error } = await supabase
      .from("listings")
      .insert({
        seller_id: u.user.id,
        seller_type: "private",
        title,
        year,
        make: form.make,
        model: form.model,
        trim: form.trim || null,
        price,
        mileage,
        vin: vin || null,
        body_type: form.body_type || null,
        transmission: form.transmission || null,
        drivetrain: form.drivetrain || null,
        fuel_type: form.fuel_type || null,
        exterior_color: form.exterior_color || null,
        interior_color: form.interior_color || null,
        condition: form.condition,
        description: form.description || null,
        features: [],
        photos: form.photos,
        location_city: form.location_city,
        location_state: form.location_state.toUpperCase(),
        zip: form.zip || null,
        status: "active",
        market_price_estimate: market,
        deal_score: score,
        is_verified_seller: false,
        is_promoted: false,
        last_verified_at: new Date().toISOString(),
      })
      .select()
      .single();
    setSubmitting(false);
    if (error || !data) {
      setErr(error?.message ?? "Couldn't create listing.");
      return;
    }
    router.push(`/listings/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mt-8">
      <Stepper step={step} />

      {step === 0 && (
        <section className="ak-card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Start with your VIN</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            We use NHTSA data to auto-fill the technical fields. No VIN? Skip
            and enter manually.
          </p>
          <input
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="17-character VIN"
            maxLength={17}
            className="ak-input font-mono uppercase tracking-widest"
          />
          {err && <Err msg={err} />}
          <div className="flex gap-3">
            <button
              onClick={decodeVin}
              disabled={decoding}
              className="ak-btn ak-btn-primary disabled:opacity-50"
            >
              {decoding ? "Decoding…" : "Decode VIN →"}
            </button>
            <button
              onClick={() => setStep(1)}
              className="ak-btn ak-btn-ghost border"
            >
              Skip — enter manually
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="ak-card space-y-4 p-6">
          {decoded.year && (
            <div className="rounded-md bg-[var(--color-good-soft)] p-3 text-sm text-[var(--color-good)]">
              ✓ Auto-filled from VIN. Tweak anything that's off.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <F label="Year">
              <input
                className="ak-input"
                inputMode="numeric"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </F>
            <F label="Make">
              <input
                className="ak-input"
                list="makes"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
              />
              <datalist id="makes">
                {MAKES.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </F>
            <F label="Model">
              <input
                className="ak-input"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </F>
            <F label="Trim">
              <input
                className="ak-input"
                value={form.trim}
                onChange={(e) => setForm({ ...form, trim: e.target.value })}
              />
            </F>
            <F label="Body type">
              <select
                className="ak-input"
                value={form.body_type}
                onChange={(e) =>
                  setForm({ ...form, body_type: e.target.value })
                }
              >
                <option value="">—</option>
                {BODY_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </F>
            <F label="Transmission">
              <input
                className="ak-input"
                value={form.transmission}
                onChange={(e) =>
                  setForm({ ...form, transmission: e.target.value })
                }
              />
            </F>
            <F label="Drivetrain">
              <input
                className="ak-input"
                value={form.drivetrain}
                onChange={(e) =>
                  setForm({ ...form, drivetrain: e.target.value })
                }
              />
            </F>
            <F label="Fuel">
              <input
                className="ak-input"
                value={form.fuel_type}
                onChange={(e) =>
                  setForm({ ...form, fuel_type: e.target.value })
                }
              />
            </F>
            <F label="Mileage">
              <input
                className="ak-input"
                inputMode="numeric"
                value={form.mileage}
                onChange={(e) =>
                  setForm({ ...form, mileage: e.target.value })
                }
              />
            </F>
            <F label="Exterior color">
              <input
                className="ak-input"
                value={form.exterior_color}
                onChange={(e) =>
                  setForm({ ...form, exterior_color: e.target.value })
                }
              />
            </F>
            <F label="Interior color">
              <input
                className="ak-input"
                value={form.interior_color}
                onChange={(e) =>
                  setForm({ ...form, interior_color: e.target.value })
                }
              />
            </F>
            <F label="Condition">
              <select
                className="ak-input"
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
              >
                {[
                  "Excellent",
                  "Very good",
                  "Good",
                  "Fair",
                  "Project",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </F>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="ak-btn ak-btn-ghost">
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="ak-btn ak-btn-primary"
            >
              Next: pricing & photos →
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="ak-card space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <F label="Asking price ($)">
              <input
                className="ak-input"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </F>
            <F label="ZIP">
              <input
                className="ak-input"
                inputMode="numeric"
                maxLength={5}
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
              />
            </F>
            <F label="City">
              <input
                className="ak-input"
                value={form.location_city}
                onChange={(e) =>
                  setForm({ ...form, location_city: e.target.value })
                }
              />
            </F>
            <F label="State">
              <input
                className="ak-input"
                maxLength={2}
                value={form.location_state}
                onChange={(e) =>
                  setForm({
                    ...form,
                    location_state: e.target.value.toUpperCase(),
                  })
                }
              />
            </F>
          </div>
          <F label="Description">
            <textarea
              rows={4}
              className="ak-input"
              placeholder="What makes your car worth buying?"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </F>
          <F label="Photo URLs (paste links one at a time)">
            <div className="flex gap-2">
              <input
                className="ak-input flex-1"
                placeholder="https://…"
                value={form.photoInput}
                onChange={(e) =>
                  setForm({ ...form, photoInput: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPhoto();
                  }
                }}
              />
              <button onClick={addPhoto} className="ak-btn ak-btn-ghost border">
                Add
              </button>
            </div>
            {!!form.photos.length && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {form.photos.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={p}
                    alt=""
                    className="aspect-[4/3] rounded-md object-cover"
                  />
                ))}
              </div>
            )}
          </F>

          {err && <Err msg={err} />}
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="ak-btn ak-btn-ghost">
              ← Back
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="ak-btn ak-btn-primary disabled:opacity-50"
            >
              {submitting ? "Publishing…" : "Publish listing →"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["VIN", "Vehicle", "Price & photos"];
  return (
    <ol className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              i <= step
                ? "bg-[var(--color-brand)] text-white"
                : "bg-[var(--color-line)]"
            }`}
          >
            {i + 1}
          </span>
          {s}
          {i < steps.length - 1 && <span className="opacity-30">→</span>}
        </li>
      ))}
    </ol>
  );
}

function F({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <div className="rounded-md bg-[var(--color-bad-soft)] p-2 text-xs text-[var(--color-bad)]">
      {msg}
    </div>
  );
}

function titleCase(s: string | undefined) {
  if (!s) return s ?? "";
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeBody(s: string | undefined) {
  if (!s) return s;
  const l = s.toLowerCase();
  if (l.includes("suv") || l.includes("sport utility")) return "SUV";
  if (l.includes("sedan")) return "Sedan";
  if (l.includes("coupe")) return "Coupe";
  if (l.includes("truck") || l.includes("pickup")) return "Truck";
  if (l.includes("convertible") || l.includes("roadster"))
    return "Convertible";
  if (l.includes("hatchback")) return "Hatchback";
  if (l.includes("wagon")) return "Wagon";
  if (l.includes("van") || l.includes("minivan")) return "Van";
  return s;
}

function estimateMarket(year: number, mileage: number) {
  const age = Math.max(new Date().getFullYear() - year, 0);
  const base = 32000;
  const ageHit = Math.min(age, 20) * 1300;
  const mileageHit = Math.min(mileage / 1000, 250) * 55;
  return Math.max(1500, Math.round(base - ageHit - mileageHit));
}

function computeDealScore(price: number, market: number) {
  if (!market) return null;
  const diff = (market - price) / market;
  const score = Math.round(70 + diff * 100);
  return Math.max(0, Math.min(100, score));
}
