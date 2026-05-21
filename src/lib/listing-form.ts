export function estimateMarket(year: number, mileage: number) {
  const age = Math.max(new Date().getFullYear() - year, 0);
  const base = 32000;
  const ageHit = Math.min(age, 20) * 1300;
  const mileageHit = Math.min(mileage / 1000, 250) * 55;
  return Math.max(1500, Math.round(base - ageHit - mileageHit));
}

export function computeDealScore(price: number, market: number) {
  if (!market) return null;
  const diff = (market - price) / market;
  const score = Math.round(70 + diff * 100);
  return Math.max(0, Math.min(100, score));
}

export function titleCase(s: string | undefined) {
  if (!s) return s ?? "";
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeBody(s: string | undefined) {
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
