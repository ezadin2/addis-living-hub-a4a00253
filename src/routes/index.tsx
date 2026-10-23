import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, BadgeCheck, Building2, Car, FileSignature, Home, KeyRound, Lock, Search, ShieldCheck, Sofa, Store, Users, Eye,
} from "lucide-react";
import hero from "@/assets/hero.jpg";
import { PageShell } from "@/components/site/PageShell";
import { ListingCard } from "@/components/site/ListingCard";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, NEIGHBORHOODS, fallbackImage, formatETB, listingImages, unitLabel, type Category, type Kind } from "@/lib/listings";

const kindOf = (v: string): Kind | undefined =>
  v.startsWith("kind:") ? (v.slice(5) as Kind) : CATEGORIES.find((c) => c.id === v)?.kind;
import { publicListingsQuery } from "@/lib/queries";
import { Construction, Truck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FaydaRent — Find your next rental in Ethiopia: houses, rooms, cars & equipment" },
      { name: "description", content: "Discover houses, apartments, rooms, vehicles and equipment for rent across Ethiopia with identity-verified owners and transparent rental terms." },
      { property: "og:title", content: "FaydaRent — Rent anything in Ethiopia" },
      { property: "og:description", content: "Houses, rooms, vehicles and equipment with verified owners and transparent terms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const HOME_CATS = [
  { id: "apartment", kind: "property", icon: Building2 }, { id: "house", kind: "property", icon: Home }, { id: "room", kind: "property", icon: Users },
  { id: "commercial", kind: "property", icon: Store }, { id: "furnished", kind: "property", icon: Sofa },
  { id: "car", kind: "vehicle", icon: Car }, { id: "truck", kind: "vehicle", icon: Truck }, { id: "construction", kind: "equipment", icon: Construction },
] as const;

function Index() {
  const { data = [] } = useQuery(publicListingsQuery);
  const featured = [...data].sort((a, b) => Number(b.premium) - Number(a.premium)).slice(0, 6);
  const recent = [...data]
    .sort((a, b) => String((b as { created_at?: string }).created_at ?? "").localeCompare(String((a as { created_at?: string }).created_at ?? "")))
    .slice(0, 4);
  return (
    <PageShell>
      <Hero />

      <section className="container-page mt-20">
        <SectionHead title="Browse by category" link={{ to: "/categories", label: "All categories" }} />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {HOME_CATS.map((h) => {
            const c = CATEGORIES.find((x) => x.id === h.id)!;
            const Icon = h.icon;
            return (
              <Link key={c.id} to="/rentals" search={{ kind: h.kind, category: c.id }} className="rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                <Icon className="h-6 w-6 text-accent" />
                <p className="mt-4 font-semibold">{c.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.blurb}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page mt-20">
        <SectionHead title="Featured rentals" sub="Homes, vehicles and equipment" link={{ to: "/rentals", label: "View all" }} />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      </section>

      <TrustSection />

      <section className="container-page mt-20">
        <SectionHead title="How it works" link={{ to: "/how-it-works", label: "Learn more" }} />
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            [Search, "Discover or list", "Search verified listings across Ethiopia, or publish your own property in minutes."],
            [BadgeCheck, "Verify your identity", "Confirm who you are through Fayda once the authorized integration is live."],
            [FileSignature, "Agree transparently", "Contact the other party, review terms and complete a digital rental agreement."],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof Search;
            return (
              <li key={t as string} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <I className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-4 font-semibold">{t as string}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d as string}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="container-page mt-20 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <SectionHead title="Popular neighborhoods" />
          <div className="mt-6 flex flex-wrap gap-2">
            {NEIGHBORHOODS.map((n) => (
              <Link key={n} to="/rentals" search={{ neighborhood: n }} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent">
                {n}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHead title="Recently added" />
          <div className="mt-6 space-y-3">
            {recent.map((l) => (
              <Link key={l.id} to="/rentals/$id" params={{ id: l.id }} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 hover:shadow-card">
                <img
                  src={listingImages(l)[0]}
                  onError={(e) => { const fb = fallbackImage(l.kind); if (e.currentTarget.src !== new URL(fb, window.location.href).href) e.currentTarget.src = fb; }}
                  alt={l.title}
                  loading="lazy"
                  className="h-16 w-20 shrink-0 rounded-lg bg-muted object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.title}</p>
                  <p className="text-sm text-muted-foreground">{l.neighborhood} · {formatETB(l.price)}/{unitLabel(l.price_unit)}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-20">
        <div className="grid items-center gap-8 rounded-2xl bg-primary p-8 text-primary-foreground sm:p-12 md:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Own a property? Reach serious renters.</h2>
            <p className="mt-3 max-w-xl text-primary-foreground/75">List for free, show your verification status, and manage inquiries and viewing requests in one place.</p>
          </div>
          <div className="flex gap-3 md:justify-end">
            <Button asChild variant="accent" size="lg"><Link to="/list-property">List your property</Link></Button>
          </div>
        </div>
      </section>

      <section className="container-page mt-20 max-w-3xl">
        <h2 className="text-2xl font-bold">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-6">
          {[
            ["Is FaydaRent free for renters?", "Yes. Browsing, saving properties and contacting owners is free for renters."],
            ["What does “ID verified” mean?", "It means the person behind the account confirmed their identity through an authorized Fayda verification. It does not prove property ownership or guarantee a listing is genuine — always view a property before paying."],
            ["Is Fayda verification live?", "Not yet. The verification flow is ready but runs in a clearly labelled demo state until an authorized integration is approved."],
            ["Are digital agreements legally binding?", "Generated agreements help both parties document terms. Legal validity depends on applicable Ethiopian law and should be reviewed by a legal professional."],
            ["Should I pay a deposit before viewing?", "No. Never send money before viewing the property in person and confirming the other party's details."],
          ].map(([q, a]) => (
            <AccordionItem key={q} value={q ?? ""}>
              <AccordionTrigger className="text-left">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </PageShell>
  );
}

function SectionHead({ title, sub, link }: { title: string; sub?: string; link?: { to: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {link && <Link to={link.to} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:underline">{link.label}<ArrowRight className="h-4 w-4" /></Link>}
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [neighborhood, setN] = useState("");
  const [category, setC] = useState("");
  const [minPrice, setMin] = useState("");
  const [maxPrice, setMax] = useState("");
  const [bedrooms, setB] = useState("");
  const field = "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <section className="relative isolate overflow-hidden">
      <img src={hero} alt="Modern apartment building in Addis Ababa" width={1920} height={1088} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 hero-overlay" />
      <div className="container-page py-20 sm:py-28">
        <div className="max-w-2xl text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
            <ShieldCheck className="h-4 w-4 text-accent" /> Trust-first renting in Ethiopia
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">Find your next rental.<br />Houses, rooms, vehicles & equipment.</h1>
          <p className="mt-4 text-base text-primary-foreground/80 sm:text-lg">
            Discover houses, rooms, vehicles and equipment for rent across Ethiopia, connect with owners, and build trust through verified identities and transparent rental agreements.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({
              to: "/rentals",
              search: {
                neighborhood: neighborhood || undefined,
                kind: category.startsWith("kind:") ? (category.slice(5) as Kind) : CATEGORIES.find((c) => c.id === category)?.kind,
                category: (category && !category.startsWith("kind:") ? category : undefined) as Category | undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                bedrooms: bedrooms && kindOf(category) === "property" ? Number(bedrooms) : undefined,
              },
            });
          }}
          className="mt-10 grid gap-3 rounded-2xl bg-card p-4 shadow-lift sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.7fr_auto]"
        >
          <label className="text-xs font-semibold text-muted-foreground">Neighborhood
            <select value={neighborhood} onChange={(e) => setN(e.target.value)} className={field + " mt-1"}>
              <option value="">Anywhere in Addis Ababa</option>
              {NEIGHBORHOODS.map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">What are you renting?
            <select value={category} onChange={(e) => { setC(e.target.value); if (e.target.value && kindOf(e.target.value) !== "property") setB(""); }} className={field + " mt-1"}>
              <option value="">All categories</option>
              {([["property", "Properties"], ["vehicle", "Vehicles"], ["equipment", "Equipment"]] as const).map(([k, label]) => (
                <optgroup key={k} label={label}>
                  <option value={`kind:${k}`}>All {label.toLowerCase()}</option>
                  {CATEGORIES.filter((c) => c.kind === k).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted-foreground">Min ETB
            <input inputMode="numeric" value={minPrice} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="0" className={field + " mt-1"} />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">Max ETB
            <input inputMode="numeric" value={maxPrice} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Any" className={field + " mt-1"} />
          </label>
          {(() => {
            const kind = kindOf(category);
            if (kind === "property") return (
              <label className="text-xs font-semibold text-muted-foreground">Bedrooms
                <select value={bedrooms} onChange={(e) => setB(e.target.value)} className={field + " mt-1"}>
                  <option value="">Any</option>
                  {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}+</option>)}
                </select>
              </label>
            );
            return (
              <label className="text-xs font-semibold text-muted-foreground">{kind === "vehicle" ? "Vehicles" : kind === "equipment" ? "Equipment" : "Any type"}
                <div className={field + " mt-1 flex items-center text-muted-foreground"}>{kind ? "Priced per day" : "Houses, cars & more"}</div>
              </label>
            );
          })()}
          <Button type="submit" variant="accent" size="lg" className="self-end"><Search /> Search</Button>
        </form>
        <p className="mt-4 flex items-center gap-2 text-xs text-primary-foreground/70">
          <Lock className="h-3.5 w-3.5" /> Fayda identity verification will be offered through an authorized integration. FaydaRent is not endorsed by the National ID Program.
        </p>
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    [BadgeCheck, "Identity verification", "Owners and renters can confirm identity through an authorized Fayda integration."],
    [Eye, "Clear verification status", "Every profile and listing shows exactly what has — and hasn't — been checked."],
    [KeyRound, "Transparent terms", "Rent, deposit, fees and minimum duration are shown up front."],
    [FileSignature, "Digital agreements", "Generate a written agreement both parties review and accept."],
    [Lock, "Privacy by design", "We never show ID numbers or sensitive identity data publicly."],
    [ShieldCheck, "Traceability", "Inquiries and agreements are recorded to help resolve disputes."],
  ] as const;
  return (
    <section className="mt-20 bg-card border-y border-border">
      <div className="container-page py-16 grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Trust & safety</p>
          <h2 className="mt-2 text-3xl font-bold">Built to reduce rental fraud</h2>
          <p className="mt-4 text-muted-foreground">Identity verification confirms who someone is. It does not prove that they own a property or that a listing is genuine — always view in person before paying.</p>
          <Button asChild variant="outline" className="mt-6"><Link to="/safety">Read our safety guide</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(([Icon, t, d]) => (
            <div key={t} className="flex gap-4 rounded-xl border border-border p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft"><Icon className="h-5 w-5 text-accent" /></span>
              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
