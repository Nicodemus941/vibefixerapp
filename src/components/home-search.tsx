"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BODY_TYPES, MAKES } from "@/lib/types";

export function HomeSearch() {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [body, setBody] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [zip, setZip] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (body) params.set("body", body);
    if (priceMax) params.set("priceMax", priceMax);
    if (zip) params.set("zip", zip);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="ak-card grid grid-cols-2 gap-3 p-4 shadow-sm md:grid-cols-5"
    >
      <select
        value={make}
        onChange={(e) => setMake(e.target.value)}
        className="ak-input"
      >
        <option value="">Any make</option>
        {MAKES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="ak-input"
      >
        <option value="">Any body</option>
        {BODY_TYPES.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <select
        value={priceMax}
        onChange={(e) => setPriceMax(e.target.value)}
        className="ak-input"
      >
        <option value="">Any price</option>
        <option value="10000">Under $10K</option>
        <option value="20000">Under $20K</option>
        <option value="30000">Under $30K</option>
        <option value="50000">Under $50K</option>
        <option value="80000">Under $80K</option>
      </select>
      <input
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        placeholder="ZIP code"
        className="ak-input"
        maxLength={5}
      />
      <button type="submit" className="ak-btn ak-btn-primary col-span-2 md:col-span-1">
        Search cars
      </button>
    </form>
  );
}
