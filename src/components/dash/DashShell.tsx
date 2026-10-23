import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Home, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/site/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

export interface NavItem { id: string; label: string; icon: LucideIcon; badge?: number | undefined }
export interface NavGroup { title: string; items: NavItem[] }

const ROLE_LABEL: Record<Role, string> = { admin: "Admin console", owner: "Owner workspace", renter: "Renter hub" };

/** Redirects to the right dashboard when the signed-in role does not match. */
export function useRoleGate(role: Role) {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (auth.loading) return;
    if (!auth.session) void navigate({ to: "/signin", replace: true });
    else if (auth.role && auth.role !== role) void navigate({ to: "/dashboard", replace: true });
  }, [auth.loading, auth.session, auth.role, role, navigate]);
  return { ...auth, ready: !auth.loading && !!auth.session && auth.role === role };
}

export function DashShell({ role, groups, active, onSelect, title, subtitle, actions, children }: {
  role: Role; groups: NavGroup[]; active: string; onSelect: (id: string) => void;
  title: string; subtitle?: string; actions?: ReactNode; children: ReactNode;
}) {
  const { name, email, userId, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
      return count ?? 0;
    },
  });
  const initials = (name || email || "U").split(/[\s@]/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");
  const activeLabel = groups.flatMap((g) => g.items).find((i) => i.id === active)?.label ?? "Overview";

  const out = async () => {
    await qc.cancelQueries(); qc.clear(); await signOut();
    void navigate({ to: "/signin", replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
        <p className="mt-1 pl-11 text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
            {g.items.map((it) => (
              <button key={it.id} onClick={() => { onSelect(it.id); setOpen(false); }}
                className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active === it.id ? "bg-accent-soft text-accent" : "text-foreground/80 hover:bg-muted")}>
                <it.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{it.label}</span>
                {!!it.badge && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">{it.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted"><Home className="h-4 w-4" />Back to site</Link>
        <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name || "Account"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <button onClick={() => void out()} aria-label="Sign out" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-card shadow-lift">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-md p-1.5 hover:bg-muted" aria-label="Close menu"><X className="h-4 w-4" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-md p-1.5 hover:bg-muted lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <p className="text-sm text-muted-foreground"><span className="capitalize">{role}</span> / <span className="font-medium text-foreground">{activeLabel}</span></p>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => onSelect("notifications")} className="relative rounded-md p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
            </button>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{initials}</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          <div className="mt-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
