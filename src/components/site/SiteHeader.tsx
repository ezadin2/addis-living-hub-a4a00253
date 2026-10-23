import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/rentals", label: "Find Rentals" },
  { to: "/categories", label: "Categories" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/safety", label: "Safety & Verification" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="FaydaRent home">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="h-5 w-5 text-accent" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-primary">
        Fayda<span className="text-accent">Rent</span>
      </span>
    </Link>
  );
}

function AuthButtons({ onDone }: { onDone?: () => void }) {
  const { session, name, role, signOut } = useAuth();
  if (session)
    return (
      <>
        <Button asChild variant="outline" size="sm"><Link to="/dashboard" onClick={onDone}><LayoutDashboard />{name ? name.split(" ")[0] : "Dashboard"}{role && <span className="ml-1 rounded bg-accent-soft px-1.5 text-[10px] font-bold uppercase text-accent">{role}</span>}</Link></Button>
        <Button variant="ghost" size="sm" onClick={() => { void signOut(); onDone?.(); }} aria-label="Sign out"><LogOut /></Button>
      </>
    );
  return (
    <>
      <Button asChild variant="ghost" size="sm"><Link to="/signin" onClick={onDone}>Sign in</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/signin" search={{ mode: "signup" }} onClick={onDone}>Create account</Link></Button>
    </>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <AuthButtons />
          <Button asChild variant="accent" size="sm"><Link to="/list-property">List an item</Link></Button>
        </div>
        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2.5 text-sm font-medium">
                {n.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <AuthButtons onDone={() => setOpen(false)} />
              <Button asChild variant="accent" className="col-span-2"><Link to="/list-property" onClick={() => setOpen(false)}>List an item</Link></Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
