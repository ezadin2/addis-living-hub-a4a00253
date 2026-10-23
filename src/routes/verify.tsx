import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, Lock } from "lucide-react";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { VerificationBadge } from "@/components/site/VerificationBadge";
import { Button } from "@/components/ui/button";
import type { VerificationStatus } from "@/lib/listings";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Identity verification (sandbox) — FaydaRent" },
      { name: "description", content: "Preview the Fayda identity verification flow. Runs in a labelled sandbox until an authorized integration is approved." },
      { property: "og:title", content: "Identity verification — FaydaRent" },
      { property: "og:description", content: "Preview of the Fayda verification flow (sandbox)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const [status, setStatus] = useState<VerificationStatus>("not_verified");
  return (
    <PageShell>
      <PageHeading eyebrow="Verification" title="Verify your identity" intro="Confirm who you are so others can rent from — or to — you with more confidence." />
      <div className="container-page mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 rounded-lg bg-warning-soft p-3 text-sm"><FlaskConical className="h-4 w-4 shrink-0" />Sandbox mode — no real Fayda check is performed and no ID data is collected.</div>
          <div className="mt-6 flex items-center justify-between"><h2 className="text-lg font-bold">Your status</h2><VerificationBadge status={status} /></div>
          <ol className="mt-6 space-y-3 text-sm">
            <li>1. You'll be redirected to the authorized Fayda provider.</li>
            <li>2. You approve sharing a minimal identity confirmation.</li>
            <li>3. FaydaRent receives only a verified / not verified result from the server.</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="accent" onClick={() => setStatus("pending")} disabled={status === "pending"}>Start verification (sandbox)</Button>
            {status === "pending" && <span className="self-center text-sm text-muted-foreground">Awaiting provider… a real result requires the live integration.</span>}
          </div>
        </section>
        <aside className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-bold"><Lock className="h-4 w-4 text-accent" />Your privacy</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>We never ask for your OTP or Fayda credentials on this site.</li>
            <li>Your ID number is never shown publicly.</li>
            <li>Verification proves identity, not property ownership.</li>
            <li>FaydaRent is not endorsed by the National ID Program.</li>
          </ul>
        </aside>
      </div>
    </PageShell>
  );
}
