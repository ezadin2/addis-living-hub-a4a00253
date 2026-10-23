import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { publicListingsQuery } from "@/lib/queries";
import { useMemo, useState } from "react";
import { LayoutGrid, List, SlidersHorizontal, X, SearchX } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ListingCard } from "@/components/site/ListingCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AMENITIES_BY_KIND, CATEGORIES, KINDS, filterListings, neighborhoodOptions,
  type Kind,
  type Category, type Filters, type Furnishing, type SortKey,
} from "@/lib/listings";

const num = (v: unknown) => (v === undefined || v === "" || isNaN(Number(v)) ? undefined : Number(v));
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/rentals/")({
  validateSearch: (s: Record<string, unknown>): Filters => ({
    kind: (["property", "vehicle", "equipment"] as const).find((k) => k === s["kind"]),
    q: str(s["q"]),
    neighborhood: str(s["neighborhood"]),
    category: str(s["category"]) as Category | undefined,
    minPrice: num(s["minPrice"]),
    maxPrice: num(s["maxPrice"]),
    bedrooms: num(s["bedrooms"]),
    bathrooms: num(s["bathrooms"]),
    furnishing: str(s["furnishing"]) as Furnishing | undefined,
    minSize: num(s["minSize"]),
    amenities: Array.isArray(s["amenities"]) ? (s["amenities"] as string[]) : undefined,
    verifiedOnly: s["verifiedOnly"] === true || s["verifiedOnly"] === "true" ? true : undefined,
    reviewedOnly: s["reviewedOnly"] === true || s["reviewedOnly"] === "true" ? true : undefined,
    seats: num(s["seats"]),
    withOperator: s["withOperator"] === true || s["withOperator"] === "true" ? true : undefined,
    sort: str(s["sort"]) as SortKey | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Find rentals in Addis Ababa — FaydaRent" },
      { name: "description", content: "Search apartments, houses, rooms and commercial spaces by neighborhood, price in ETB, bedrooms and verification status." },
      { property: "og:title", content: "Find rentals — FaydaRent" },
      { property: "og:description", content: "Filter Ethiopian rentals by price, size, amenities and verified owners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RentalsPage,
});

const PAGE = 6;

function RentalsPage() {
  const f = Route.useSearch();
  const navigate = useNavigate({ from: "/rentals/" });
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [shown, setShown] = useState(PAGE);
  const { data: allListings = [] } = useQuery(publicListingsQuery);
  const results = useMemo(() => filterListings(allListings, f), [allListings, f]);
  const set = (patch: Partial<Filters>) => {
    setShown(PAGE);
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  };

  const chips: [string, Partial<Filters>][] = [];
  if (f.q) chips.push([`“${f.q}”`, { q: undefined }]);
  if (f.neighborhood) chips.push([f.neighborhood, { neighborhood: undefined }]);
  if (f.kind && !f.category) chips.push([KINDS.find((k) => k.id === f.kind)?.label ?? f.kind, { kind: undefined }]);
  if (f.category) chips.push([CATEGORIES.find((c) => c.id === f.category)?.label ?? f.category, { category: undefined }]);
  if (f.minPrice != null) chips.push([`Min ETB ${f.minPrice.toLocaleString()}`, { minPrice: undefined }]);
  if (f.maxPrice != null) chips.push([`Max ETB ${f.maxPrice.toLocaleString()}`, { maxPrice: undefined }]);
  if (f.bedrooms) chips.push([`${f.bedrooms}+ beds`, { bedrooms: undefined }]);
  if (f.bathrooms) chips.push([`${f.bathrooms}+ baths`, { bathrooms: undefined }]);
  if (f.furnishing) chips.push([f.furnishing, { furnishing: undefined }]);
  if (f.minSize) chips.push([`${f.minSize}+ m²`, { minSize: undefined }]);
  f.amenities?.forEach((a) => chips.push([a, { amenities: f.amenities!.filter((x) => x !== a) }]));
  if (f.seats) chips.push([`${f.seats}+ seats`, { seats: undefined }]);
  if (f.withOperator) chips.push(["With driver/operator", { withOperator: undefined }]);
  if (f.verifiedOnly) chips.push(["Verified owner", { verifiedOnly: undefined }]);
  if (f.reviewedOnly) chips.push(["Reviewed listing", { reviewedOnly: undefined }]);

  return (
    <PageShell>
      <div className="border-b border-border bg-card">
        <div className="container-page flex flex-col gap-3 py-6 sm:flex-row">
          <input
            key={f.q ?? ""}
            defaultValue={f.q}
            onKeyDown={(e) => e.key === "Enter" && set({ q: (e.target as HTMLInputElement).value || undefined })}
            placeholder="Search houses, rooms, cars, equipment… then press Enter"
            className="h-11 flex-1 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search rentals"
          />
          <select value={f.neighborhood ?? ""} onChange={(e) => set({ neighborhood: e.target.value || undefined })} className="h-11 rounded-lg border border-input bg-background px-3 text-sm" aria-label="Neighborhood">
            <option value="">All neighborhoods</option>
            {neighborhoodOptions(allListings).map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
            <FilterPanel f={f} set={set} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Search results</p>
              <h1 className="text-2xl font-bold">{results.length} {results.length === 1 ? "listing" : "listings"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden"><SlidersHorizontal /> Filters</Button>
                </SheetTrigger>
                <SheetContent side="left" className="overflow-y-auto">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="px-4 pb-6"><FilterPanel f={f} set={set} /></div>
                </SheetContent>
              </Sheet>
              <select value={f.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value as SortKey })} className="h-9 rounded-md border border-input bg-card px-3 text-sm" aria-label="Sort">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
              <div className="flex rounded-md border border-input bg-card">
                <button onClick={() => setLayout("grid")} aria-label="Grid view" aria-pressed={layout === "grid"} className={`p-2 ${layout === "grid" ? "text-accent" : "text-muted-foreground"}`}><LayoutGrid className="h-4 w-4" /></button>
                <button onClick={() => setLayout("list")} aria-label="List view" aria-pressed={layout === "list"} className={`p-2 ${layout === "list" ? "text-accent" : "text-muted-foreground"}`}><List className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map(([label, patch]) => (
                <button key={label} onClick={() => set(patch)} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold capitalize text-accent">
                  {label} <X className="h-3 w-3" />
                </button>
              ))}
              <Link to="/rentals" className="text-xs font-semibold text-muted-foreground underline">Clear all</Link>
            </div>
          )}

          {results.length === 0 ? (
            <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">No rentals match these filters</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try widening your price range or removing a filter.</p>
              <Button asChild variant="outline" className="mt-5"><Link to="/rentals">Clear all filters</Link></Button>
            </div>
          ) : (
            <>
              <div className={`mt-6 grid gap-6 ${layout === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}>
                {results.slice(0, shown).map((l) => <ListingCard key={l.id} l={l} layout={layout} />)}
              </div>
              {shown < results.length && (
                <div className="mt-8 text-center">
                  <Button variant="outline" onClick={() => setShown((s) => s + PAGE)}>Load more</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function FilterPanel({ f, set }: { f: Filters; set: (p: Partial<Filters>) => void }) {
  const input = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
  const toggleAmenity = (a: string) => {
    const cur = f.amenities ?? [];
    const next = cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a];
    set({ amenities: next.length ? next : undefined });
  };
  const kind = CATEGORIES.find((c) => c.id === f.category)?.kind ?? f.kind;
  const amenities = kind ? AMENITIES_BY_KIND[kind] : AMENITIES_BY_KIND.property;
  return (
    <div className="space-y-6 text-sm">
      <Group title="Category">
        <select value={f.category ?? (f.kind ? `kind:${f.kind}` : "")} onChange={(e) => {
          const v = e.target.value;
          const k = v.startsWith("kind:") ? (v.slice(5) as Kind) : CATEGORIES.find((c) => c.id === v)?.kind;
          set({ category: (v && !v.startsWith("kind:") ? v : undefined) as Category | undefined, kind: k,
            ...(k && k !== "property" ? { bedrooms: undefined, bathrooms: undefined, furnishing: undefined, minSize: undefined, amenities: undefined } : {}),
            ...(k !== "vehicle" ? { seats: undefined } : {}) });
        }} className={input}>
          <option value="">All categories</option>
          {([["property", "Properties"], ["vehicle", "Vehicles"], ["equipment", "Equipment"]] as const).map(([k, label]) => (
            <optgroup key={k} label={label}>
              <option value={`kind:${k}`}>All {label.toLowerCase()}</option>
              {CATEGORIES.filter((c) => c.kind === k).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </optgroup>
          ))}
        </select>
      </Group>
      <Group title={kind === "property" ? "Monthly rent (ETB)" : kind ? "Daily price (ETB)" : "Price (ETB)"}>
        <div className="grid grid-cols-2 gap-2">
          <input key={`min${f.minPrice}`} defaultValue={f.minPrice} inputMode="numeric" placeholder="Min" onBlur={(e) => set({ minPrice: num(e.target.value) })} className={input} aria-label="Minimum price" />
          <input key={`max${f.maxPrice}`} defaultValue={f.maxPrice} inputMode="numeric" placeholder="Max" onBlur={(e) => set({ maxPrice: num(e.target.value) })} className={input} aria-label="Maximum price" />
        </div>
      </Group>
      {(!kind || kind === "property") && (<>
      <Group title="Bedrooms">
        <Pills value={f.bedrooms} options={[1, 2, 3, 4]} onChange={(v) => set({ bedrooms: v })} />
      </Group>
      <Group title="Bathrooms">
        <Pills value={f.bathrooms} options={[1, 2, 3]} onChange={(v) => set({ bathrooms: v })} />
      </Group>
      <Group title="Furnishing">
        <select value={f.furnishing ?? ""} onChange={(e) => set({ furnishing: (e.target.value || undefined) as Furnishing | undefined })} className={input}>
          <option value="">Any</option>
          <option value="furnished">Furnished</option>
          <option value="semi-furnished">Semi-furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
      </Group>
      <Group title="Minimum size (m²)">
        <input key={`sz${f.minSize}`} defaultValue={f.minSize} inputMode="numeric" placeholder="e.g. 80" onBlur={(e) => set({ minSize: num(e.target.value) })} className={input} />
      </Group>
      <Group title="Amenities">
        <div className="grid grid-cols-2 gap-2">
          {amenities.map((a) => (
            <label key={a} className="flex items-center gap-2">
              <input type="checkbox" checked={f.amenities?.includes(a) ?? false} onChange={() => toggleAmenity(a)} className="accent-[var(--accent)]" /> {a}
            </label>
          ))}
        </div>
      </Group>
      </>)}
      {kind === "vehicle" && (
        <Group title="Seats">
          <Pills value={f.seats} options={[4, 7, 14]} onChange={(v) => set({ seats: v })} />
        </Group>
      )}
      {(kind === "vehicle" || kind === "equipment") && (
        <Group title={kind === "vehicle" ? "Driver" : "Operator"}>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.withOperator} onChange={(e) => set({ withOperator: e.target.checked || undefined })} /> {kind === "vehicle" ? "Driver included" : "Operator included"}</label>
        </Group>
      )}
      <Group title="Trust">
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.verifiedOnly} onChange={(e) => set({ verifiedOnly: e.target.checked || undefined })} /> ID-verified owner only</label>
        <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={!!f.reviewedOnly} onChange={(e) => set({ reviewedOnly: e.target.checked || undefined })} /> Reviewed listings only</label>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Pills({ value, options, onChange }: { value?: number | undefined; options: number[]; onChange: (v?: number) => void }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? undefined : o)}
          aria-pressed={value === o}
          className={`h-9 flex-1 rounded-md border text-sm font-medium ${value === o ? "border-accent bg-accent-soft text-accent" : "border-input bg-background"}`}
        >
          {o}+
        </button>
      ))}
    </div>
  );
}
