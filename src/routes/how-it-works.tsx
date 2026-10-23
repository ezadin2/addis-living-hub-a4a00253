import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How FaydaRent works — for renters and owners" },
      { name: "description", content: "Discover, verify and agree: how renting and listing works on FaydaRent." },
      { property: "og:title", content: "How FaydaRent works" },
      { property: "og:description", content: "Discover, verify and agree on rentals in Ethiopia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const RENTER = ["Search by neighborhood, price in ETB and bedrooms.", "Save favorites and compare terms side by side.", "Check the owner's verification status.", "Request a viewing — never pay before you see it.", "Review and accept a digital rental agreement."];
const OWNER = ["Create an account and verify your identity.", "Add photos, rent, deposit and minimum duration.", "Your listing is reviewed before it goes live.", "Respond to inquiries and schedule viewings.", "Generate an agreement with your chosen renter."];

function Page() {
  return (
    <PageShell>
      <PageHeading eyebrow="How it works" title="Simple steps, built on trust" />
      <div className="container-page mt-10 grid gap-8 md:grid-cols-2">
        {[["For renters", RENTER, "/rentals", "Find a rental"], ["For owners & agents", OWNER, "/list-property", "List a property"]].map(([t, steps, to, cta]) => (
          <section key={t as string} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold">{t as string}</h2>
            <ol className="mt-5 space-y-4">
              {(steps as string[]).map((s, i) => (
                <li key={s} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span><span className="text-sm">{s}</span></li>
              ))}
            </ol>
            <Button asChild variant="accent" className="mt-6"><Link to={to as string}>{cta as string}</Link></Button>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
