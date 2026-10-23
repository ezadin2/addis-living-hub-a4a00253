import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { VerificationBadge } from "@/components/site/VerificationBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety & verification — FaydaRent" },
      { name: "description", content: "What FaydaRent verification badges mean, and how to rent safely in Ethiopia." },
      { property: "og:title", content: "Safety & verification — FaydaRent" },
      { property: "og:description", content: "Understand verification badges and avoid rental scams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <PageHeading eyebrow="Safety" title="Verification, explained honestly" intro="Badges tell you what has been checked — and just as importantly, what hasn't." />
      <div className="container-page mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold">What each badge means</h2>
          <ul className="mt-5 space-y-4">
            {([["verified", "Identity confirmed through an authorized Fayda check. Does not prove ownership."], ["pending", "The person has started verification; the result isn't back yet."], ["not_verified", "No identity check has been completed. Take extra care."], ["failed", "The identity check did not succeed. Be cautious."]] as const).map(([s, d]) => (
              <li key={s} className="rounded-xl border border-border bg-card p-4"><VerificationBadge status={s} className="px-3 py-1 text-sm" /><p className="mt-2 text-sm text-muted-foreground">{d}</p></li>
            ))}
          </ul>
        </section>
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Do</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-border">
              <li>View the property in person before paying anything.</li><li>Ask to see proof of ownership or agency authorization.</li><li>Put agreed terms in writing.</li><li>Keep communication on FaydaRent where possible.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-destructive">Watch out for</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-border">
              <li>Requests for a deposit before a viewing.</li><li>Prices far below the neighborhood average.</li><li>Pressure to decide immediately.</li><li>Anyone asking for your Fayda OTP or ID number.</li>
            </ul>
          </div>
          <Button asChild variant="accent"><Link to="/verify">See the verification flow</Link></Button>
        </section>
      </div>
    </PageShell>
  );
}
