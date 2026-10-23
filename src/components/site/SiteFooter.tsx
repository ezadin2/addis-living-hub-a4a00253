import { Link } from "@tanstack/react-router";
import { Logo } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            A trust-first rental marketplace for Ethiopia. Not affiliated with or endorsed by the National ID Program.
          </p>
        </div>
        <FooterCol title="Explore" links={[["/rentals", "Find rentals"], ["/categories", "Categories"], ["/list-property", "List your property"]]} />
        <FooterCol title="Trust" links={[["/safety", "Safety & verification"], ["/verify", "Identity verification"], ["/how-it-works", "How it works"]]} />
        <FooterCol title="Company" links={[["/legal", "Privacy & terms"], ["/legal", "Help & contact"]]} />
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© 2026 FaydaRent. Addis Ababa, Ethiopia.</span>
          <span>Listings shown are demo data while the platform is in development.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map(([to, label]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
