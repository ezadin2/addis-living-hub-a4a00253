import { AgreementQR } from "@/components/dash/AgreementQR";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Banknote, Bell, CalendarCheck, Clock, FileSignature, Heart, LayoutDashboard, MessageSquare, Search, Star,
} from "lucide-react";
import { DashShell, useRoleGate, type NavGroup } from "@/components/dash/DashShell";
import {
  Empty, NotificationsPanel, Panel, StatCard, StatGrid, Status, Table, ago, btn, btnAccent, btnDanger, fmtDate, input, td, useAction,
} from "@/components/dash/parts";
import { ListingCard } from "@/components/site/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { publicListingsQuery } from "@/lib/queries";
import { CATEGORIES, formatETB } from "@/lib/listings";

type Tab = "overview" | "requests" | "saved" | "agreements" | "payments" | "reviews" | "support" | "notifications";

export const Route = createFileRoute("/renter")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => (typeof s["tab"] === "string" ? { tab: s["tab"] as Tab } : {}),
  head: () => ({
    meta: [
      { title: "Renter hub — FaydaRent" },
      { name: "description", content: "Track your rental requests, saved listings, agreements and payments." },
      { property: "og:title", content: "Renter hub — FaydaRent" },
      { property: "og:description", content: "Everything you're renting, in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RenterPage,
});

function useRenterData(uid: string | null) {
  const opt = <T,>(key: string, fn: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) => ({
    queryKey: ["renter", key, uid], enabled: !!uid,
    queryFn: async () => { const { data, error } = await fn(); if (error) throw new Error(error.message); return data ?? []; },
  });
  const bookings = useQuery(opt("bookings", () => supabase.from("bookings").select("*").eq("renter_id", uid!).order("created_at", { ascending: false })));
  const favorites = useQuery(opt("favorites", () => supabase.from("favorites").select("*").eq("user_id", uid!)));
  const agreements = useQuery(opt("agreements", () => supabase.from("agreements").select("*").eq("renter_id", uid!).order("created_at", { ascending: false })));
  const payments = useQuery(opt("payments", () => supabase.from("payments").select("*").eq("renter_id", uid!).order("created_at", { ascending: false })));
  const reviews = useQuery(opt("reviews", () => supabase.from("reviews").select("*").eq("reviewer_id", uid!)));
  const reports = useQuery(opt("reports", () => supabase.from("reports").select("*").eq("reporter_id", uid!).order("created_at", { ascending: false })));
  const listings = useQuery(publicListingsQuery);
  return {
    bookings: bookings.data ?? [], favorites: favorites.data ?? [], agreements: agreements.data ?? [], payments: payments.data ?? [],
    reviews: reviews.data ?? [], reports: reports.data ?? [], listings: listings.data ?? [],
  };
}
type D = ReturnType<typeof useRenterData>;

function RenterPage() {
  const gate = useRoleGate("renter");
  const { tab = "overview" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const d = useRenterData(gate.userId);
  if (!gate.ready) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading your hub…</div>;
  const go = (t: Tab) => void navigate({ search: { tab: t } });
  const toSign = d.agreements.filter((a) => a.status === "shared").length;
  const groups: NavGroup[] = [
    { title: "Main", items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "notifications", label: "Notifications", icon: Bell },
    ] },
    { title: "My renting", items: [
      { id: "requests", label: "My requests", icon: MessageSquare },
      { id: "saved", label: "Saved", icon: Heart, badge: d.favorites.length },
      { id: "agreements", label: "Agreements", icon: FileSignature, badge: toSign },
      { id: "payments", label: "Payments", icon: Banknote },
    ] },
    { title: "More", items: [
      { id: "reviews", label: "My reviews", icon: Star },
      { id: "support", label: "Help & reports", icon: AlertTriangle },
    ] },
  ];
  const titles: Record<Tab, [string, string]> = {
    overview: [`Hi, ${gate.name.split(" ")[0] || "there"}`, "Your rentals, requests and saved items."],
    requests: ["My requests", "Rental and viewing requests you've sent."],
    saved: ["Saved", "Listings you've saved for later."],
    agreements: ["Agreements", "Review and accept agreements your owners share."],
    payments: ["Payments", "Payments recorded for your rentals."],
    reviews: ["My reviews", "Review rentals once they're completed."],
    support: ["Help & reports", "Report a problem or open a dispute."],
    notifications: ["Notifications", "Updates on your requests and agreements."],
  };
  return (
    <DashShell role="renter" groups={groups} active={tab} onSelect={(t) => go(t as Tab)} title={titles[tab][0]} subtitle={titles[tab][1]}
      actions={<Link to="/rentals" className={btnAccent}><Search className="h-3.5 w-3.5" />Find rentals</Link>}>
      {tab === "overview" && <Overview d={d} go={go} />}
      {tab === "requests" && <RequestsTab d={d} />}
      {tab === "saved" && <SavedTab d={d} />}
      {tab === "agreements" && <AgreementsTab d={d} />}
      {tab === "payments" && <PaymentsTab d={d} />}
      {tab === "reviews" && <ReviewsTab d={d} />}
      {tab === "support" && <SupportTab d={d} uid={gate.userId!} />}
      {tab === "notifications" && <NotificationsPanel />}
    </DashShell>
  );
}

const titleOf = (d: D, id: string) => d.listings.find((l) => l.id === id)?.title ?? "Listing";

function Overview({ d, go }: { d: D; go: (t: Tab) => void }) {
  const active = d.bookings.filter((b) => b.status === "approved");
  const paid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
  const next = [...active].sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
  const toSign = d.agreements.filter((a) => a.status === "shared");
  const saved = new Set(d.favorites.map((f) => f.listing_id));
  const recs = d.listings.filter((l) => !saved.has(l.id)).slice(0, 3);
  return (
    <>
      <StatGrid>
        <StatCard icon={CalendarCheck} label="Active rentals" value={active.length} />
        <StatCard icon={Clock} label="Awaiting owner" value={d.bookings.filter((b) => b.status === "pending").length} tone="warning" />
        <StatCard icon={Heart} label="Saved listings" value={d.favorites.length} tone="primary" />
        <StatCard icon={Banknote} label="Total paid" value={formatETB(paid)} />
      </StatGrid>
      {toSign.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4">
          <div><p className="font-semibold">{toSign.length} agreement{toSign.length > 1 ? "s" : ""} waiting for you</p><p className="text-sm text-muted-foreground">Read and accept the terms your owner shared.</p></div>
          <button className={btnAccent} onClick={() => go("agreements")}>Review now</button>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Panel title="Next rental">
          {!next ? <Empty text="No upcoming rentals."><Link to="/rentals" className={btnAccent}>Browse rentals</Link></Empty> : (
            <div>
              <p className="font-display text-lg font-bold">{titleOf(d, next.listing_id)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{fmtDate(next.start_date)} → {fmtDate(next.end_date)}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold">{formatETB(next.total)}</p></div>
                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Status</p><Status s={next.status} /></div>
              </div>
              {next.owner_note && <p className="mt-3 text-sm italic text-muted-foreground">Owner: “{next.owner_note}”</p>}
              <Link to="/rentals/$id" params={{ id: next.listing_id }} className={btn + " mt-4"}>View listing</Link>
            </div>
          )}
        </Panel>
        <Panel title="Recent requests" action={<button className={btn} onClick={() => go("requests")}>View all</button>}>
          {d.bookings.length === 0 ? <Empty text="You haven't sent any requests yet." /> : (
            <ul className="-my-2 divide-y divide-border">
              {d.bookings.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{titleOf(d, b.listing_id)}</p><p className="text-xs text-muted-foreground">{fmtDate(b.start_date)} · {formatETB(b.total)} · {ago(b.created_at)}</p></div>
                  <Status s={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title="Browse by category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => <Link key={c.id} to="/rentals" search={{ category: c.id }} className={btn}>{c.label}</Link>)}
        </div>
      </Panel>
      {recs.length > 0 && (
        <Panel title="Recommended for you">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{recs.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        </Panel>
      )}
    </>
  );
}

function RequestsTab({ d }: { d: D }) {
  const act = useAction();
  if (d.bookings.length === 0) return <Panel title="My requests"><Empty text="No requests yet."><Link to="/rentals" className={btnAccent}>Find something to rent</Link></Empty></Panel>;
  return (
    <Panel title={`${d.bookings.length} requests`}>
      <Table head={["Listing", "Type", "Dates", "Total", "Status", ""]}>
        {d.bookings.map((b) => (
          <tr key={b.id}>
            <td className={td}><Link to="/rentals/$id" params={{ id: b.listing_id }} className="font-medium hover:text-accent">{titleOf(d, b.listing_id)}</Link>{b.owner_note && <p className="text-xs text-muted-foreground">Owner: {b.owner_note}</p>}</td>
            <td className={td + " capitalize"}>{b.kind}</td>
            <td className={td + " whitespace-nowrap"}>{fmtDate(b.start_date)} → {fmtDate(b.end_date)}</td>
            <td className={td}>{formatETB(b.total)}</td>
            <td className={td}><Status s={b.status} /></td>
            <td className={td}>{(b.status === "pending" || b.status === "approved") && <button className={btnDanger} onClick={() => { if (window.confirm("Cancel this request?")) void act(() => supabase.from("bookings").update({ status: "cancelled" }).eq("id", b.id), "Request cancelled"); }}>Cancel</button>}</td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

function SavedTab({ d }: { d: D }) {
  const ids = new Set(d.favorites.map((f) => f.listing_id));
  const saved = d.listings.filter((l) => ids.has(l.id));
  return (
    <Panel title={`${saved.length} saved`}>
      {saved.length === 0 ? <Empty text="Tap the heart on any listing to save it here."><Link to="/rentals" className={btnAccent}>Browse rentals</Link></Empty> : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{saved.map((l) => <ListingCard key={l.id} l={l} />)}</div>
      )}
    </Panel>
  );
}

function AgreementsTab({ d }: { d: D }) {
  const act = useAction();
  return (
    <Panel title="Agreements">
      {d.agreements.length === 0 ? <Empty text="When an owner shares an agreement, it will appear here." /> : (
        <div className="space-y-4">
          {d.agreements.map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2"><p className="flex-1 font-medium">{titleOf(d, a.listing_id)}</p><Status s={a.status} /></div>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-xs">{a.terms}</pre>
              {a.status === "shared" && <button className={btnAccent + " mt-3"} onClick={() => { if (window.confirm("Accept these terms?")) void act(() => supabase.from("agreements").update({ status: "accepted" }).eq("id", a.id), "Agreement accepted"); }}><FileSignature className="h-3.5 w-3.5" />Accept agreement</button>}
              {a.accepted_at && <p className="mt-2 text-xs text-muted-foreground">You accepted on {fmtDate(a.accepted_at)}</p>}
              {(a.status === "shared" || a.status === "accepted") && <AgreementQR id={a.id} title={titleOf(d, a.listing_id)} status={a.status} date={a.accepted_at ?? a.shared_at ?? a.created_at} />}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function PaymentsTab({ d }: { d: D }) {
  const title = (bid: string) => titleOf(d, d.bookings.find((b) => b.id === bid)?.listing_id ?? "");
  return (
    <Panel title="Payments">
      {d.payments.length === 0 ? <Empty text="No payments recorded yet. Owners record payments after you pay them." /> : (
        <Table head={["Date", "Rental", "Amount", "Method", "Reference"]}>
          {d.payments.map((p) => <tr key={p.id}><td className={td}>{fmtDate(p.created_at)}</td><td className={td}>{title(p.booking_id)}</td><td className={td + " font-medium"}>{formatETB(p.amount)}</td><td className={td + " capitalize"}>{p.method.replace("_", " ")}</td><td className={td}>{p.reference || "—"}</td></tr>)}
        </Table>
      )}
    </Panel>
  );
}

function ReviewsTab({ d }: { d: D }) {
  const act = useAction();
  const todo = d.bookings.filter((b) => b.status === "completed" && !d.reviews.some((r) => r.booking_id === b.id));
  return (
    <>
      <Panel title="Waiting for your review">
        {todo.length === 0 ? <Empty text="Nothing to review right now." /> : (
          <div className="space-y-4">
            {todo.map((b) => (
              <form key={b.id} className="rounded-lg border border-border p-4" onSubmit={(e) => {
                e.preventDefault(); const f = new FormData(e.currentTarget);
                void act(() => supabase.from("reviews").insert({ booking_id: b.id, listing_id: b.listing_id, reviewer_id: b.renter_id, rating: Number(f.get("rating")), comment: String(f.get("comment") ?? "").slice(0, 1000) }), "Thanks for your review");
              }}>
                <p className="font-medium">{titleOf(d, b.listing_id)}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <select name="rating" defaultValue="5" className={input + " w-32"}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
                  <input name="comment" maxLength={1000} placeholder="How was it?" className={input + " flex-1"} />
                  <button className={btnAccent + " h-9"}>Submit</button>
                </div>
              </form>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Reviews you've written">
        {d.reviews.length === 0 ? <Empty text="No reviews yet." /> : (
          <ul className="-my-2 divide-y divide-border">{d.reviews.map((r) => <li key={r.id} className="py-3"><span className="text-accent">{"★".repeat(r.rating)}</span> <span className="text-sm font-medium">{titleOf(d, r.listing_id)}</span>{r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}</li>)}</ul>
        )}
      </Panel>
    </>
  );
}

function SupportTab({ d, uid }: { d: D; uid: string }) {
  const act = useAction();
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
      <Panel title="Report a problem">
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget;
          const booking = String(f.get("booking") || "");
          void act(() => supabase.from("reports").insert({
            reporter_id: uid, kind: String(f.get("kind")), reason: String(f.get("reason")).slice(0, 200), details: String(f.get("details") ?? "").slice(0, 2000),
            booking_id: booking || null, listing_id: booking ? d.bookings.find((b) => b.id === booking)?.listing_id ?? null : null,
          }), "Report sent to our team").then((ok) => ok && form.reset());
        }}>
          <select name="kind" className={input}><option value="support">Support question</option><option value="rental">Problem with a rental</option><option value="dispute">Dispute with owner</option><option value="listing">Misleading listing</option></select>
          <select name="booking" className={input}><option value="">Not about a specific rental</option>{d.bookings.map((b) => <option key={b.id} value={b.id}>{titleOf(d, b.listing_id)} · {fmtDate(b.start_date)}</option>)}</select>
          <input name="reason" required minLength={3} maxLength={200} placeholder="Short summary" className={input} />
          <textarea name="details" rows={4} maxLength={2000} placeholder="What happened?" className={input + " h-auto py-2"} />
          <button className={btnAccent + " h-9 w-full justify-center"}>Send report</button>
        </form>
      </Panel>
      <Panel title="Your reports">
        {d.reports.length === 0 ? <Empty text="You haven't filed any reports." /> : (
          <ul className="-my-2 divide-y divide-border">{d.reports.map((r) => (
            <li key={r.id} className="py-3"><div className="flex items-center gap-2"><Status s={r.status} /><span className="text-xs uppercase text-muted-foreground">{r.kind}</span><span className="text-xs text-muted-foreground">{ago(r.created_at)}</span></div><p className="mt-1 text-sm font-medium">{r.reason}</p>{r.admin_note && <p className="text-sm text-muted-foreground">Team: {r.admin_note}</p>}</li>
          ))}</ul>
        )}
      </Panel>
    </div>
  );
}
