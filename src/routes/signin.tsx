import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signin")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" | undefined } => (s["mode"] === "signup" ? { mode: "signup" } : {}),
  head: () => ({
    meta: [
      { title: "Sign in or create an account — FaydaRent" },
      { name: "description", content: "Sign in to book rentals, manage your listings or administer the platform." },
      { property: "og:title", content: "Sign in — FaydaRent" },
      { property: "og:description", content: "Access your FaydaRent account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const f = "mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm";
const DEMOS = [
  { label: "Admin", email: "admin@renta.demo", pw: "Admin123!" },
  { label: "Owner", email: "owner@renta.demo", pw: "Owner123!" },
  { label: "Renter", email: "renter@renta.demo", pw: "Renter123!" },
];

function Page() {
  const { mode } = Route.useSearch();
  const signup = mode === "signup";
  const navigate = useNavigate();
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"renter" | "owner">("renter");

  useEffect(() => { if (session) void navigate({ to: "/dashboard" }); }, [session, navigate]);

  const signIn = async (e: string, p: string) => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Signed in");
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!signup) return signIn(email, pw);
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim().slice(0, 100), role } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) toast.success("Check your email to confirm your account, then sign in.");
  };

  return (
    <PageShell>
      <div className="container-page grid max-w-5xl gap-8 py-14 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-bold">{signup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browsing is always free — an account lets you book, list and manage rentals.</p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            {signup && (
              <>
                <label className="block text-sm font-medium">Full name<input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={f} /></label>
                <fieldset>
                  <legend className="text-sm font-medium">I want to</legend>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {(["renter", "owner"] as const).map((r) => (
                      <button key={r} type="button" onClick={() => setRole(r)} aria-pressed={role === r}
                        className={`rounded-md border p-3 text-left text-sm ${role === r ? "border-accent bg-accent-soft" : "border-input"}`}>
                        <p className="font-semibold">{r === "renter" ? "Rent things" : "List my items"}</p>
                        <p className="text-xs text-muted-foreground">{r === "renter" ? "Book homes, vehicles, equipment" : "Earn from property, vehicles, equipment"}</p>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            <label className="block text-sm font-medium">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={f} /></label>
            <label className="block text-sm font-medium">Password<input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className={f} /></label>
            <Button type="submit" variant="accent" className="w-full" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {signup ? "Already have an account? " : "New here? "}
            <Link to="/signin" search={signup ? {} : { mode: "signup" }} className="font-semibold text-accent">{signup ? "Sign in" : "Create an account"}</Link>
          </p>
        </div>
        <aside className="rounded-xl border border-border bg-card p-6 shadow-card">
          <p className="font-semibold">Demo accounts</p>
          <p className="mt-1 text-xs text-muted-foreground">One click to sign in as each role.</p>
          <div className="mt-4 space-y-3">
            {DEMOS.map((d) => (
              <button key={d.email} disabled={busy} onClick={() => void signIn(d.email, d.pw)}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition hover:border-accent hover:bg-accent-soft">
                
                <span className="text-sm"><span className="block font-semibold">{d.label}</span><span className="text-xs text-muted-foreground">{d.email} · {d.pw}</span></span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
