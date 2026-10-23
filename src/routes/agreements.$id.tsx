import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Status, fmtDate } from "@/components/dash/parts";
import { verifyAgreement } from "@/lib/agreement-verify.functions";

export const Route = createFileRoute("/agreements/$id")({
  loader: ({ params }) => verifyAgreement({ data: { id: params.id } }).catch(() => null),
  head: () => ({
    meta: [
      { title: "Verify rental agreement — FaydaRent" },
      { name: "description", content: "Check that a FaydaRent rental agreement is genuine and see its current status." },
      { property: "og:title", content: "Verify rental agreement — FaydaRent" },
      { property: "og:description", content: "Scan-to-verify page for FaydaRent rental agreements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const a = Route.useLoaderData();
  return (
    <PageShell>
      <div className="container-page flex justify-center py-12 sm:py-16">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="bg-primary px-6 py-5 text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Agreement verification</p>
            <h1 className="mt-1 text-xl font-bold">{a ? "Genuine FaydaRent agreement" : "Agreement not found"}</h1>
          </div>
          {a ? (
            <dl className="divide-y divide-border px-6 text-sm">
              {([
                ["Reference", <span className="font-mono font-semibold">{a.ref}</span>],
                ["Status", <Status s={a.status} />],
                ["Item", a.listing],
                ["Location", a.city || "—"],
                ["Issued", fmtDate(a.sharedAt ?? a.createdAt)],
                ["Accepted", fmtDate(a.acceptedAt)],
              ] as const).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="px-6 py-6 text-sm text-muted-foreground">This code does not match any shared agreement. Ask the other party to send the agreement again through FaydaRent.</p>
          )}
          <div className="border-t border-border bg-muted/50 px-6 py-4 text-xs text-muted-foreground">
            Personal details are never shown here. <Link to="/safety" className="font-semibold text-accent">Safety tips</Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
