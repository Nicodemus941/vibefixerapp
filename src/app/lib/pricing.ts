// F.A.S.T. cash price estimator.
//
// Numbers below are realistic Florida-market cash ranges for windshield work
// from a mobile installer (not dealer/Safelite list price). They're honest
// estimates, but Eric/the team should adjust this file once they see how
// the rates land vs. real jobs. Single source of truth for pricing logic.
//
// All outputs are RANGES — never a single number. Final price is always
// confirmed before any work starts.

export type Category =
  | "economy"
  | "sedan"
  | "suv-small"
  | "suv-large"
  | "truck"
  | "van"
  | "luxury";

export type Service = "chip-repair" | "windshield-replace" | "side-back";

export const SERVICE_META: Record<
  Service,
  { label: string; short: string; insuredText: string }
> = {
  "chip-repair": {
    label: "Rock chip / small crack repair",
    short: "Chip repair",
    insuredText: "Often $0 with comprehensive insurance",
  },
  "windshield-replace": {
    label: "Windshield replacement",
    short: "Replacement",
    insuredText: "$0 with most comprehensive insurance",
  },
  "side-back": {
    label: "Side, vent, or rear glass",
    short: "Side / rear glass",
    insuredText: "Insurance accepted · cash quotes too",
  },
};

const CATEGORY_META: Record<
  Category,
  { label: string; ranges: Record<Service, [number, number]> }
> = {
  economy: {
    label: "Compact / economy",
    ranges: {
      "chip-repair": [69, 99],
      "windshield-replace": [249, 329],
      "side-back": [169, 229],
    },
  },
  sedan: {
    label: "Sedan",
    ranges: {
      "chip-repair": [69, 99],
      "windshield-replace": [289, 379],
      "side-back": [199, 259],
    },
  },
  "suv-small": {
    label: "Compact SUV / crossover",
    ranges: {
      "chip-repair": [79, 109],
      "windshield-replace": [339, 439],
      "side-back": [219, 279],
    },
  },
  "suv-large": {
    label: "Full-size SUV",
    ranges: {
      "chip-repair": [79, 109],
      "windshield-replace": [389, 509],
      "side-back": [249, 319],
    },
  },
  truck: {
    label: "Pickup truck",
    ranges: {
      "chip-repair": [79, 109],
      "windshield-replace": [359, 469],
      "side-back": [229, 299],
    },
  },
  van: {
    label: "Minivan / cargo van",
    ranges: {
      "chip-repair": [79, 109],
      "windshield-replace": [349, 449],
      "side-back": [229, 289],
    },
  },
  luxury: {
    label: "Luxury / premium",
    ranges: {
      "chip-repair": [89, 129],
      "windshield-replace": [539, 729],
      "side-back": [319, 439],
    },
  },
};

// Newer cars more often have ADAS sensors / cameras / heads-up display, which
// adds calibration time and OEM-glass cost. Multiplier on the base range.
function yearMultiplier(year: number): number {
  if (year >= 2023) return 1.3;
  if (year >= 2019) return 1.18;
  if (year >= 2015) return 1.08;
  return 1.0;
}

// Vehicle dataset — covers the most common cars on Florida roads.
// Anything not on the list falls back to a reasonable default category.
type VehicleEntry = { make: string; model: string; category: Category };

export const VEHICLES: readonly VehicleEntry[] = [
  // Toyota
  { make: "Toyota", model: "Camry", category: "sedan" },
  { make: "Toyota", model: "Corolla", category: "sedan" },
  { make: "Toyota", model: "RAV4", category: "suv-small" },
  { make: "Toyota", model: "Highlander", category: "suv-large" },
  { make: "Toyota", model: "4Runner", category: "suv-large" },
  { make: "Toyota", model: "Tacoma", category: "truck" },
  { make: "Toyota", model: "Tundra", category: "truck" },
  { make: "Toyota", model: "Sienna", category: "van" },
  { make: "Toyota", model: "Prius", category: "economy" },
  // Honda
  { make: "Honda", model: "Civic", category: "sedan" },
  { make: "Honda", model: "Accord", category: "sedan" },
  { make: "Honda", model: "CR-V", category: "suv-small" },
  { make: "Honda", model: "Pilot", category: "suv-large" },
  { make: "Honda", model: "Odyssey", category: "van" },
  { make: "Honda", model: "Ridgeline", category: "truck" },
  { make: "Honda", model: "HR-V", category: "suv-small" },
  // Ford
  { make: "Ford", model: "F-150", category: "truck" },
  { make: "Ford", model: "F-250 / F-350", category: "truck" },
  { make: "Ford", model: "Ranger", category: "truck" },
  { make: "Ford", model: "Escape", category: "suv-small" },
  { make: "Ford", model: "Explorer", category: "suv-large" },
  { make: "Ford", model: "Expedition", category: "suv-large" },
  { make: "Ford", model: "Bronco", category: "suv-small" },
  { make: "Ford", model: "Mustang", category: "sedan" },
  { make: "Ford", model: "Edge", category: "suv-small" },
  // Chevrolet
  { make: "Chevrolet", model: "Silverado 1500", category: "truck" },
  { make: "Chevrolet", model: "Silverado 2500/3500", category: "truck" },
  { make: "Chevrolet", model: "Equinox", category: "suv-small" },
  { make: "Chevrolet", model: "Tahoe", category: "suv-large" },
  { make: "Chevrolet", model: "Suburban", category: "suv-large" },
  { make: "Chevrolet", model: "Traverse", category: "suv-large" },
  { make: "Chevrolet", model: "Malibu", category: "sedan" },
  { make: "Chevrolet", model: "Colorado", category: "truck" },
  // GMC
  { make: "GMC", model: "Sierra 1500", category: "truck" },
  { make: "GMC", model: "Yukon", category: "suv-large" },
  { make: "GMC", model: "Acadia", category: "suv-large" },
  { make: "GMC", model: "Terrain", category: "suv-small" },
  // Ram
  { make: "Ram", model: "1500", category: "truck" },
  { make: "Ram", model: "2500/3500", category: "truck" },
  // Jeep
  { make: "Jeep", model: "Wrangler", category: "suv-small" },
  { make: "Jeep", model: "Grand Cherokee", category: "suv-large" },
  { make: "Jeep", model: "Cherokee", category: "suv-small" },
  { make: "Jeep", model: "Gladiator", category: "truck" },
  { make: "Jeep", model: "Compass", category: "suv-small" },
  // Dodge
  { make: "Dodge", model: "Charger", category: "sedan" },
  { make: "Dodge", model: "Challenger", category: "sedan" },
  { make: "Dodge", model: "Durango", category: "suv-large" },
  // Nissan
  { make: "Nissan", model: "Altima", category: "sedan" },
  { make: "Nissan", model: "Sentra", category: "sedan" },
  { make: "Nissan", model: "Rogue", category: "suv-small" },
  { make: "Nissan", model: "Pathfinder", category: "suv-large" },
  { make: "Nissan", model: "Frontier", category: "truck" },
  { make: "Nissan", model: "Titan", category: "truck" },
  // Hyundai
  { make: "Hyundai", model: "Elantra", category: "sedan" },
  { make: "Hyundai", model: "Sonata", category: "sedan" },
  { make: "Hyundai", model: "Tucson", category: "suv-small" },
  { make: "Hyundai", model: "Santa Fe", category: "suv-small" },
  { make: "Hyundai", model: "Palisade", category: "suv-large" },
  // Kia
  { make: "Kia", model: "Forte", category: "sedan" },
  { make: "Kia", model: "K5", category: "sedan" },
  { make: "Kia", model: "Sportage", category: "suv-small" },
  { make: "Kia", model: "Sorento", category: "suv-small" },
  { make: "Kia", model: "Telluride", category: "suv-large" },
  { make: "Kia", model: "Soul", category: "economy" },
  // Subaru
  { make: "Subaru", model: "Outback", category: "suv-small" },
  { make: "Subaru", model: "Forester", category: "suv-small" },
  { make: "Subaru", model: "Crosstrek", category: "suv-small" },
  { make: "Subaru", model: "Impreza", category: "sedan" },
  { make: "Subaru", model: "Ascent", category: "suv-large" },
  // Mazda
  { make: "Mazda", model: "CX-5", category: "suv-small" },
  { make: "Mazda", model: "CX-30", category: "suv-small" },
  { make: "Mazda", model: "CX-9", category: "suv-large" },
  { make: "Mazda", model: "Mazda3", category: "sedan" },
  { make: "Mazda", model: "Mazda6", category: "sedan" },
  // Volkswagen
  { make: "Volkswagen", model: "Jetta", category: "sedan" },
  { make: "Volkswagen", model: "Passat", category: "sedan" },
  { make: "Volkswagen", model: "Tiguan", category: "suv-small" },
  { make: "Volkswagen", model: "Atlas", category: "suv-large" },
  // BMW
  { make: "BMW", model: "3 Series", category: "luxury" },
  { make: "BMW", model: "5 Series", category: "luxury" },
  { make: "BMW", model: "X3", category: "luxury" },
  { make: "BMW", model: "X5", category: "luxury" },
  // Mercedes-Benz
  { make: "Mercedes-Benz", model: "C-Class", category: "luxury" },
  { make: "Mercedes-Benz", model: "E-Class", category: "luxury" },
  { make: "Mercedes-Benz", model: "GLC", category: "luxury" },
  { make: "Mercedes-Benz", model: "GLE", category: "luxury" },
  // Audi
  { make: "Audi", model: "A4", category: "luxury" },
  { make: "Audi", model: "Q5", category: "luxury" },
  { make: "Audi", model: "Q7", category: "luxury" },
  // Lexus
  { make: "Lexus", model: "RX", category: "luxury" },
  { make: "Lexus", model: "ES", category: "luxury" },
  { make: "Lexus", model: "NX", category: "luxury" },
  { make: "Lexus", model: "GX", category: "luxury" },
  // Acura
  { make: "Acura", model: "MDX", category: "luxury" },
  { make: "Acura", model: "RDX", category: "luxury" },
  { make: "Acura", model: "TLX", category: "luxury" },
  // Tesla
  { make: "Tesla", model: "Model 3", category: "luxury" },
  { make: "Tesla", model: "Model Y", category: "luxury" },
  { make: "Tesla", model: "Model S", category: "luxury" },
  { make: "Tesla", model: "Model X", category: "luxury" },
];

const MAKES = Array.from(new Set(VEHICLES.map((v) => v.make))).sort();

export function getMakes(): readonly string[] {
  return MAKES;
}

export function getModels(make: string): readonly string[] {
  return VEHICLES.filter((v) => v.make === make).map((v) => v.model);
}

export function getCategory(make: string, model: string): Category {
  return VEHICLES.find((v) => v.make === make && v.model === model)?.category ?? "sedan";
}

export type Estimate = {
  category: Category;
  categoryLabel: string;
  service: Service;
  serviceLabel: string;
  insuredText: string;
  range: [number, number];
  midpoint: number;
  // What pushes price up vs. down for this vehicle/year
  factors: string[];
};

export function estimate(
  year: number,
  category: Category,
  service: Service,
): Estimate {
  const meta = CATEGORY_META[category];
  const baseRange = meta.ranges[service];
  const mult = yearMultiplier(year);

  // Apply year multiplier and round to a clean $10 boundary.
  const round10 = (n: number) => Math.round(n / 10) * 10;
  const range: [number, number] = [round10(baseRange[0] * mult), round10(baseRange[1] * mult)];
  const midpoint = round10((range[0] + range[1]) / 2);

  const factors: string[] = [];
  if (year >= 2023) {
    factors.push("Newer model — likely needs ADAS camera calibration after install");
  } else if (year >= 2019) {
    factors.push("ADAS / lane-keep cameras possible — calibration may apply");
  } else if (year >= 2015) {
    factors.push("Some sensor packages possible (rain sensor / heads-up display)");
  } else {
    factors.push("Standard glass — no ADAS calibration expected");
  }

  if (category === "luxury") {
    factors.push("OEM glass typically required for premium vehicles");
  }
  if (service === "chip-repair") {
    factors.push("Chip repairs are usually $0 with comprehensive insurance");
  }
  if (service === "windshield-replace") {
    factors.push("Final price confirmed in person before any work begins");
  }

  return {
    category,
    categoryLabel: meta.label,
    service,
    serviceLabel: SERVICE_META[service].label,
    insuredText: SERVICE_META[service].insuredText,
    range,
    midpoint,
    factors,
  };
}

// Year picker bounds.
export const YEARS: readonly number[] = (() => {
  const now = new Date().getFullYear();
  const arr: number[] = [];
  for (let y = now + 1; y >= 2005; y--) arr.push(y);
  return arr;
})();
