export type ListingStatus = "active" | "pending" | "sold" | "expired";
export type SellerType = "private" | "dealer";

export interface Listing {
  id: string;
  seller_id: string | null;
  dealer_id: string | null;
  seller_type: SellerType;
  title: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  price: number;
  mileage: number;
  vin: string | null;
  body_type: string | null;
  transmission: string | null;
  drivetrain: string | null;
  fuel_type: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  condition: string | null;
  description: string | null;
  features: string[];
  photos: string[];
  location_city: string;
  location_state: string;
  zip: string | null;
  status: ListingStatus;
  market_price_estimate: number | null;
  deal_score: number | null;
  is_verified_seller: boolean;
  is_promoted: boolean;
  created_at: string;
  last_verified_at: string;
  sold_at: string | null;
}

export interface SearchParams {
  q?: string;
  make?: string;
  model?: string;
  body?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  sellerType?: SellerType | "any";
  state?: string;
  zip?: string;
  sort?:
    | "best-deal"
    | "newest"
    | "price-asc"
    | "price-desc"
    | "mileage-asc"
    | "year-desc";
  page?: number;
}

export const BODY_TYPES = [
  "Sedan",
  "SUV",
  "Truck",
  "Coupe",
  "Convertible",
  "Hatchback",
  "Wagon",
  "Van",
  "Minivan",
] as const;

export const MAKES = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Tesla",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lexus",
  "Subaru",
  "Mazda",
  "Hyundai",
  "Kia",
  "Nissan",
  "Volkswagen",
  "Jeep",
  "Ram",
  "Porsche",
  "Volvo",
  "Acura",
] as const;
