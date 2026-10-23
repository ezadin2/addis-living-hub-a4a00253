import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import hero from "@/assets/hero.jpg";
import vSuv from "@/assets/v-suv.jpg";
import vVan from "@/assets/v-van.jpg";
import eExc from "@/assets/e-excavator.jpg";
import eGen from "@/assets/e-generator.jpg";
import type { Tables } from "@/integrations/supabase/types";

export type Listing = Tables<"listings">;
export type Booking = Tables<"bookings">;
export type Kind = "property" | "vehicle" | "equipment";
export type VerificationStatus = "not_verified" | "pending" | "verified" | "failed";
export type Category = string;
export type Furnishing = "furnished" | "semi-furnished" | "unfurnished";

const IMAGES: Record<string, string> = {
  p1, p2, p3, hero, "v-suv": vSuv, "v-van": vVan, "e-excavator": eExc, "e-generator": eGen,
};
export const IMAGE_CHOICES: Record<Kind, string[]> = {
  property: ["p1", "p2", "p3", "hero"],
  vehicle: ["v-suv", "v-van"],
  equipment: ["e-excavator", "e-generator"],
};
const isUsable = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "" && (v in IMAGES || /^(https?:|data:|blob:|\/)/.test(v.trim()));
export const imageUrl = (key: string) => IMAGES[key] ?? key;
/** Demo image for a listing kind, used when a listing has no usable photos or one fails to load. */
export const fallbackImage = (kind?: string | null, i = 0) => {
  const choices = IMAGE_CHOICES[(kind as Kind) in IMAGE_CHOICES ? (kind as Kind) : "property"];
  return imageUrl(choices[i % choices.length]!);
};
export const listingImages = (l: Pick<Listing, "images" | "kind">) => {
  const own = (l.images ?? []).filter(isUsable).map((k) => imageUrl(k.trim()));
  if (own.length) return own;
  return IMAGE_CHOICES[(l.kind as Kind) in IMAGE_CHOICES ? (l.kind as Kind) : "property"].map(imageUrl);
};

export const KINDS: { id: Kind; label: string; blurb: string }[] = [
  { id: "property", label: "Properties", blurb: "Apartments, houses, rooms and offices" },
  { id: "vehicle", label: "Vehicles", blurb: "Cars, SUVs, vans and trucks — with or without driver" },
  { id: "equipment", label: "Equipment", blurb: "Construction, power and event equipment" },
];

export const CATEGORIES: { id: string; kind: Kind; label: string; blurb: string }[] = [
  { id: "apartment", kind: "property", label: "Apartments", blurb: "Condos and flats across the city" },
  { id: "house", kind: "property", label: "Houses", blurb: "Villas, G+1 and family homes" },
  { id: "room", kind: "property", label: "Rooms & shared", blurb: "Affordable rooms and shared living" },
  { id: "furnished", kind: "property", label: "Furnished rentals", blurb: "Move-in ready, short or long stay" },
  { id: "commercial", kind: "property", label: "Commercial spaces", blurb: "Offices, shops and studios" },
  { id: "car", kind: "vehicle", label: "Cars", blurb: "Economy and executive sedans" },
  { id: "suv", kind: "vehicle", label: "SUVs & 4x4", blurb: "For city and countryside trips" },
  { id: "van", kind: "vehicle", label: "Vans & minibuses", blurb: "Group travel and transfers" },
  { id: "truck", kind: "vehicle", label: "Trucks", blurb: "Cargo and moving" },
  { id: "construction", kind: "equipment", label: "Construction", blurb: "Excavators, mixers, loaders" },
  { id: "power", kind: "equipment", label: "Power", blurb: "Generators and lighting" },
  { id: "event", kind: "equipment", label: "Events", blurb: "Tents, chairs, sound" },
];
export const categoriesFor = (k?: Kind) => (k ? CATEGORIES.filter((c) => c.kind === k) : CATEGORIES);
export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const NEIGHBORHOODS = [
  "Bole", "CMC", "Sarbet", "Kazanchis", "Summit", "Ayat", "Old Airport", "Gerji", "Megenagna", "Piassa",
];

/** Predefined neighborhoods plus any custom ones owners typed, de-duplicated case-insensitively. */
export const neighborhoodOptions = (list: Pick<Listing, "neighborhood">[] = []) => {
  const seen = new Map<string, string>();
  for (const n of [...NEIGHBORHOODS, ...list.map((l) => l.neighborhood?.trim() ?? "")]) {
    if (n && !seen.has(n.toLowerCase())) seen.set(n.toLowerCase(), n);
  }
  return [...seen.values()];
};

export const AMENITIES_BY_KIND: Record<Kind, string[]> = {
  property: ["Parking", "Water tank", "Generator", "Security guard", "Wi‑Fi", "Elevator", "Garden", "Balcony"],
  vehicle: ["Air conditioning", "GPS", "Insurance", "Bluetooth", "Driver included"],
  equipment: ["Operator included", "Delivery", "Transport", "Maintenance", "Setup"],
};
export const AMENITIES = AMENITIES_BY_KIND.property;

export type SortKey = "newest" | "price_asc" | "price_desc";

export interface Filters {
  kind?: Kind | undefined;
  q?: string | undefined;
  neighborhood?: string | undefined;
  category?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  furnishing?: Furnishing | undefined;
  minSize?: number | undefined;
  amenities?: string[] | undefined;
  transmission?: string | undefined;
  fuel?: string | undefined;
  seats?: number | undefined;
  minYear?: number | undefined;
  withOperator?: boolean | undefined;
  verifiedOnly?: boolean | undefined;
  reviewedOnly?: boolean | undefined;
  sort?: SortKey | undefined;
}

export function filterListings(list: Listing[], f: Filters): Listing[] {
  const q = f.q?.trim().toLowerCase();
  const out = list.filter((l) => {
    if (f.kind && l.kind !== f.kind) return false;
    if (q) {
      const cat = CATEGORIES.find((c) => c.id === l.category);
      const kindLabel = KINDS.find((k) => k.id === l.kind)?.label ?? "";
      const hay = `${l.title} ${l.neighborhood} ${l.city} ${l.make ?? ""} ${l.model ?? ""} ${l.category} ${cat?.label ?? ""} ${l.kind} ${kindLabel} ${l.description ?? ""}`.toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, "")))) return false;
    }
    if (f.neighborhood && l.neighborhood.trim().toLowerCase() !== f.neighborhood.trim().toLowerCase()) return false;
    if (f.category && l.category !== f.category) return false;
    if (f.minPrice != null && Number(l.price) < f.minPrice) return false;
    if (f.maxPrice != null && Number(l.price) > f.maxPrice) return false;
    if (f.bedrooms != null && l.bedrooms < f.bedrooms) return false;
    if (f.bathrooms != null && l.bathrooms < f.bathrooms) return false;
    if (f.furnishing && l.furnishing !== f.furnishing) return false;
    if (f.minSize != null && (l.size_sqm ?? 0) < f.minSize) return false;
    if (f.amenities?.length && !f.amenities.every((a) => l.amenities.includes(a))) return false;
    if (f.transmission && l.transmission !== f.transmission) return false;
    if (f.fuel && l.fuel !== f.fuel) return false;
    if (f.seats != null && (l.seats ?? 0) < f.seats) return false;
    if (f.minYear != null && (l.year ?? 0) < f.minYear) return false;
    if (f.withOperator && !l.with_operator) return false;
    if (f.verifiedOnly && !l.owner_verified) return false;
    return true;
  });
  const sort = f.sort ?? "newest";
  return out.sort((a, b) =>
    sort === "price_asc" ? Number(a.price) - Number(b.price)
      : sort === "price_desc" ? Number(b.price) - Number(a.price)
      : Number(b.premium) - Number(a.premium) || b.created_at.localeCompare(a.created_at),
  );
}

/** Days inclusive for daily rentals; months (min term enforced) for monthly. */
export function bookingQuote(l: Pick<Listing, "price" | "price_unit" | "min_term">, start: string, end: string, months: number) {
  if (l.price_unit === "day") {
    if (!start || !end) return { units: 0, total: 0 };
    const d = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
    const units = d > 0 ? d : 0;
    return { units, total: units * Number(l.price) };
  }
  const units = Math.max(months || 0, l.min_term);
  return { units, total: units * Number(l.price) };
}

export const formatETB = (n: number | string) => `ETB ${Number(n).toLocaleString("en-US")}`;
export const unitLabel = (u: string) => (u === "day" ? "day" : "month");
