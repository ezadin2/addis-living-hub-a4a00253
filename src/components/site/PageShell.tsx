import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeading({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="border-b border-border bg-card">
      <div className="container-page py-12">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-muted-foreground">{intro}</p>}
      </div>
    </div>
  );
}
