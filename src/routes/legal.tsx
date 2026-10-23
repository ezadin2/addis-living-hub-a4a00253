import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeading } from "@/components/site/PageShell";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Privacy, terms & help — FaydaRent" },
      { name: "description", content: "How FaydaRent handles your data, platform terms, and how to get help." },
      { property: "og:title", content: "Privacy, terms & help — FaydaRent" },
      { property: "og:description", content: "Privacy, terms and help for FaydaRent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PageShell>
      <PageHeading eyebrow="Legal" title="Privacy, terms & help" intro="Draft summary — full policies will be published after legal review." />
      <div className="container-page mt-10 max-w-3xl space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section><h2 className="text-lg font-bold text-foreground">Privacy</h2><p className="mt-2">We collect only what's needed to run the marketplace. Identity data from verification is limited to a verification result; we do not store raw national ID data unless legally required.</p></section>
        <section><h2 className="text-lg font-bold text-foreground">Terms</h2><p className="mt-2">FaydaRent connects renters and owners and does not own listed properties. Generated agreements help document terms; their legal effect depends on applicable Ethiopian law.</p></section>
        <section><h2 className="text-lg font-bold text-foreground">Help & contact</h2><p className="mt-2">Contact details will be published at launch.</p></section>
      </div>
    </PageShell>
  ),
});
