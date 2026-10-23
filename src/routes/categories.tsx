import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { KINDS, categoriesFor, imageUrl, IMAGE_CHOICES } from "@/lib/listings";
import { publicListingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Rental categories — homes, vehicles & equipment | FaydaRent" },
      { name: "description", content: "Browse apartments, houses, cars, SUVs, vans, trucks, construction and event equipment for rent in Addis Ababa." },
      { property: "og:title", content: "Rental categories — FaydaRent" },
      { property: "og:description", content: "Homes, vehicles and equipment for rent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data = [] } = useQuery(publicListingsQuery);
  return (
    <PageShell>
      <PageHeading eyebrow="Categories" title="What are you looking for?" intro="Homes, vehicles and equipment — all with transparent pricing and verified owners." />
      <div className="container-page mt-10 space-y-14 pb-16">
        {KINDS.map((k) => (
          <section key={k.id}>
            <div className="flex items-end justify-between">
              <div><h2 className="text-2xl font-bold">{k.label}</h2><p className="text-sm text-muted-foreground">{k.blurb}</p></div>
              <Link to="/rentals" search={{ kind: k.id }} className="text-sm font-semibold text-accent">Browse all →</Link>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categoriesFor(k.id).map((c, i) => {
                const items = data.filter((l) => l.category === c.id);
                const img = items[0]?.images[0] ?? IMAGE_CHOICES[k.id][i % IMAGE_CHOICES[k.id].length]!;
                return (
                  <Link key={c.id} to="/rentals" search={{ kind: k.id, category: c.id }} className="group overflow-hidden rounded-xl border border-border bg-card shadow-card hover:shadow-lift">
                    <img src={imageUrl(img)} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover transition group-hover:scale-105" />
                    <div className="p-4">
                      <h3 className="font-bold">{c.label}</h3>
                      <p className="text-sm text-muted-foreground">{c.blurb}</p>
                      <p className="mt-2 text-sm font-semibold text-accent">{items.length} listing{items.length === 1 ? "" : "s"} →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
