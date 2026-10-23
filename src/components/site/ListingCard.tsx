import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, Calendar, Fuel, Heart, MapPin, Ruler, Settings2, UserCog, Users } from "lucide-react";
import { categoryLabel, fallbackImage, formatETB, listingImages, unitLabel, type Listing } from "@/lib/listings";
import { useFavorites } from "@/lib/favorites";
import { VerificationBadge } from "./VerificationBadge";
import { cn } from "@/lib/utils";

export function ListingCard({ l, layout = "grid" }: { l: Listing; layout?: "grid" | "list" }) {
  const fav = useFavorites();
  const saved = fav.has(l.id);
  const img = listingImages(l)[0];
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:shadow-lift",
        layout === "list" && "sm:grid sm:grid-cols-[18rem_1fr]",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={img} onError={(e) => { const fb = fallbackImage(l.kind); if (e.currentTarget.src !== new URL(fb, window.location.href).href) e.currentTarget.src = fb; }} alt={l.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{categoryLabel(l.category)}</span>
        <button
          onClick={() => fav.toggle(l.id)}
          aria-label={saved ? "Remove from saved" : "Save"}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 shadow-card"
        >
          <Heart className={cn("h-4 w-4", saved ? "fill-accent text-accent" : "text-foreground")} />
        </button>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="font-display text-lg font-bold">{formatETB(l.price)}<span className="text-xs font-medium text-muted-foreground"> /{unitLabel(l.price_unit)}</span></p>
        <h3 className="line-clamp-1 font-semibold">{l.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{l.neighborhood}, {l.city}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {l.kind === "property" && (
            <>
              {l.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{l.bedrooms}</span>}
              <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{l.bathrooms}</span>
              {l.size_sqm && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{l.size_sqm} m²</span>}
            </>
          )}
          {l.kind === "vehicle" && (
            <>
              {l.year && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{l.year}</span>}
              {l.transmission && <span className="flex items-center gap-1 capitalize"><Settings2 className="h-4 w-4" />{l.transmission}</span>}
              {l.seats && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{l.seats}</span>}
              {l.fuel && <span className="flex items-center gap-1 capitalize"><Fuel className="h-4 w-4" />{l.fuel}</span>}
            </>
          )}
          {l.kind === "equipment" && (
            <>
              {l.make && <span>{l.make} {l.model}</span>}
              {l.condition && <span className="capitalize">{l.condition}</span>}
              {l.with_operator && <span className="flex items-center gap-1"><UserCog className="h-4 w-4" />Operator</span>}
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <VerificationBadge status={l.owner_verified ? "verified" : "not_verified"} />
          <Link to="/rentals/$id" params={{ id: l.id }} className="text-sm font-semibold text-accent hover:underline">View details</Link>
        </div>
      </div>
    </article>
  );
}
