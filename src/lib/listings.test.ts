import { describe, expect, it } from "vitest";
import { bookingQuote, listingImages, filterListings, type Listing } from "./listings";

const base = {
  id: "x", owner_id: null, kind: "property", category: "apartment", title: "T", description: "", city: "Addis Ababa",
  neighborhood: "Bole", price: 1000, price_unit: "month", bedrooms: 2, bathrooms: 1, size_sqm: 80, furnishing: "furnished",
  amenities: [], min_term: 1, deposit: null, make: null, model: null, year: null, transmission: null, fuel: null, seats: null,
  condition: null, with_operator: false, images: [], owner_name: "", owner_verified: false, status: "approved",
  available: true, views: 0, created_at: "2026-10-01",
} as unknown as Listing;
const L: Listing[] = [
  { ...base, id: "a", price: 9000 },
  { ...base, id: "b", kind: "vehicle", category: "suv", price: 6500, price_unit: "day", transmission: "automatic", seats: 7, year: 2020, owner_verified: true },
  { ...base, id: "c", kind: "equipment", category: "construction", price: 28000, price_unit: "day", with_operator: true },
];

describe("filterListings", () => {
  it("filters by kind", () => expect(filterListings(L, { kind: "vehicle" }).map((l) => l.id)).toEqual(["b"]));
  it("filters by max price", () => expect(filterListings(L, { maxPrice: 9000 }).every((l) => Number(l.price) <= 9000)).toBe(true));
  it("filters vehicles by transmission and seats", () => {
    expect(filterListings(L, { transmission: "automatic", seats: 7 }).map((l) => l.id)).toEqual(["b"]);
    expect(filterListings(L, { seats: 8 })).toHaveLength(0);
  });
  it("filters equipment with operator", () => expect(filterListings(L, { withOperator: true }).map((l) => l.id)).toEqual(["c"]));
  it("text search matches vehicle and equipment categories", () => {
    expect(filterListings(L, { q: "suv" }).map((l) => l.id)).toEqual(["b"]);
    expect(filterListings(L, { q: "equipment" }).map((l) => l.id)).toEqual(["c"]);
  });
  it("neighborhood match ignores case for custom locations", () =>
    expect(filterListings([{ ...L[0]!, neighborhood: "Lebu" }], { neighborhood: "lebu" })).toHaveLength(1));
  it("an all-categories search with no filters returns every kind", () =>
    expect(filterListings(L, { q: "" }).map((l) => l.id)).toEqual(["a", "b", "c"]));
  it("falls back to demo images when photos are missing or invalid", () => {
    expect(listingImages({ kind: "vehicle", images: [] })).toHaveLength(2);
    expect(listingImages({ kind: "property", images: ["", "not-a-key"] }).length).toBeGreaterThan(0);
  });
  it("sorts price low to high", () => expect(filterListings(L, { sort: "price_asc" })[0]?.id).toBe("b"));
});

describe("bookingQuote", () => {
  it("daily rentals count days inclusive", () => {
    expect(bookingQuote({ price: 6500, price_unit: "day", min_term: 1 }, "2026-11-01", "2026-11-04", 0)).toEqual({ units: 4, total: 26000 });
  });
  it("monthly rentals enforce minimum term", () => {
    expect(bookingQuote({ price: 45000, price_unit: "month", min_term: 6 }, "", "", 2)).toEqual({ units: 6, total: 270000 });
  });
});
