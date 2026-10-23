import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity, AlertTriangle, BadgeCheck, Banknote, Bell, Building2, CalendarCheck, FolderTree, LayoutDashboard,
  Crown, ListChecks, Percent, ScrollText, Settings, Star, Users,
} from "lucide-react";
import { DashShell, useRoleGate, type NavGroup } from "@/components/dash/DashShell";
import {
  BarsChart, DonutChart, Empty, NotificationsPanel, Panel, StatCard, StatGrid, Status, Table, TrendChart,
  ago, btn, btnAccent, btnDanger, fmtDate, input, seriesByMonth, td, useAction,
} from "@/components/dash/parts";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel, formatETB } from "@/lib/listings";

type Tab = "overview" | "users" | "listings" | "bookings" | "payments" | "reports" | "reviews" | "categories" | "settings" | "audit" | "subscriptions" | "notifications";

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => (typeof s["tab"] === "string" ? { tab: s["tab"] as Tab } : {}),
  head: () => ({
    meta: [
      { title: "Admin console — FaydaRent" },
      { name: "description", content: "Moderate listings, manage users, payments, reports and platform settings." },
      { property: "og:title", content: "Admin console — FaydaRent" },
      { property: "og:description", content: "FaydaRent platform administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const q = <T,>(key: string, fn: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) => ({
  queryKey: ["admin", key],
  queryFn: async () => { const { data, error } = await fn(); if (error) throw new Error(error.message); return data ?? []; },
});

function useAdminData() {
  const profiles = useQuery(q("profiles", () => supabase.from("profiles").select("*").order("created_at", { ascending: false })));
  const roles = useQuery(q("roles", () => supabase.from("user_roles").select("*")));
  const listings = useQuery(q("listings", () => supabase.from("listings").select("*").order("created_at", { ascending: false })));
  const bookings = useQuery(q("bookings", () => supabase.from("bookings").select("*").order("created_at", { ascending: false })));
  const payments = useQuery(q("payments", () => supabase.from("payments").select("*").order("created_at", { ascending: false })));
  const reports = useQuery(q("reports", () => supabase.from("reports").select("*").order("created_at", { ascending: false })));
  const reviews = useQuery(q("reviews", () => supabase.from("reviews").select("*").order("created_at", { ascending: false })));
  const audit = useQuery(q("audit", () => supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)));
  return {
    profiles: profiles.data ?? [], roles: roles.data ?? [], listings: listings.data ?? [], bookings: bookings.data ?? [],
    payments: payments.data ?? [], reports: reports.data ?? [], reviews: reviews.data ?? [], audit: audit.data ?? [],
  };
}
type D = ReturnType<typeof useAdminData>;

function AdminPage() {
  const gate = useRoleGate("admin");
  const { tab = "overview" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const d = useAdminData();
  if (!gate.ready) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading admin console…</div>;

  const pendingListings = d.listings.filter((l) => l.status === "pending").length;
  const openReports = d.reports.filter((r) => r.status === "open" || r.status === "reviewing").length;
  const pendingVerif = d.profiles.filter((p) => p.verification_status === "pending").length;
  const groups: NavGroup[] = [
    { title: "Main", items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "notifications", label: "Notifications", icon: Bell },
    ] },
    { title: "Marketplace", items: [
      { id: "listings", label: "Listing moderation", icon: ListChecks, badge: pendingListings },
      { id: "bookings", label: "Bookings", icon: CalendarCheck },
      { id: "categories", label: "Categories", icon: FolderTree },
      { id: "reviews", label: "Reviews", icon: Star },
    ] },
    { title: "People & money", items: [
      { id: "users", label: "Users & verification", icon: Users, badge: pendingVerif },
      { id: "payments", label: "Payments & commission", icon: Banknote },
      { id: "subscriptions", label: "Subscriptions & featured", icon: Crown },
      { id: "reports", label: "Reports & disputes", icon: AlertTriangle, badge: openReports },
    ] },
    { title: "System", items: [
      { id: "settings", label: "Platform settings", icon: Settings },
      { id: "audit", label: "Audit log", icon: ScrollText },
    ] },
  ];
  const titles: Record<Tab, [string, string]> = {
    overview: [`Welcome back, ${gate.name.split(" ")[0] || "Admin"}`, "Here's what's happening across FaydaRent today."],
    users: ["Users & verification", "Manage roles, account status and identity verification."],
    listings: ["Listing moderation", "Review new and edited listings before they go live."],
    bookings: ["Bookings", "Every rental and viewing request on the platform."],
    payments: ["Payments & commission", "Recorded payments and platform commission earned."],
    reports: ["Reports & disputes", "Handle listing reports, rental disputes and support requests."],
    reviews: ["Reviews", "Moderate renter reviews."],
    categories: ["Categories", "Control which rental categories appear on the site."],
    subscriptions: ["Subscriptions & featured", "Activate business plans and featured placements after payment."],
    settings: ["Platform settings", "Commission, premium fees and support contact."],
    audit: ["Audit log", "Every admin action, recorded."],
    notifications: ["Notifications", "Alerts sent to your account."],
  };
  return (
    <DashShell role="admin" groups={groups} active={tab} onSelect={(t) => void navigate({ search: { tab: t as Tab } })}
      title={titles[tab][0]} subtitle={titles[tab][1]}
      actions={tab === "overview" && <>
        <button className={btn} onClick={() => void navigate({ search: { tab: "reports" } })}><AlertTriangle className="h-3.5 w-3.5" />Open reports ({openReports})</button>
        <button className={btnAccent} onClick={() => void navigate({ search: { tab: "listings" } })}><ListChecks className="h-3.5 w-3.5" />Review listings ({pendingListings})</button>
      </>}>
      {tab === "overview" && <Overview d={d} go={(t) => void navigate({ search: { tab: t } })} />}
      {tab === "users" && <UsersTab d={d} me={gate.userId!} />}
      {tab === "listings" && <ListingsTab d={d} />}
      {tab === "bookings" && <BookingsTab d={d} />}
      {tab === "payments" && <PaymentsTab d={d} />}
      {tab === "reports" && <ReportsTab d={d} />}
      {tab === "reviews" && <ReviewsTab d={d} />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "subscriptions" && <SubscriptionsTab d={d} />}
      {tab === "settings" && <SettingsTab />}
      {tab === "audit" && <AuditTab d={d} />}
      {tab === "notifications" && <NotificationsPanel />}
    </DashShell>
  );
}

function Overview({ d, go }: { d: D; go: (t: Tab) => void }) {
  const live = d.listings.filter((l) => l.status === "approved").length;
  const gmv = d.payments.reduce((s, p) => s + Number(p.amount), 0);
  const commission = d.payments.reduce((s, p) => s + Number(p.commission_amount), 0);
  const owners = d.roles.filter((r) => r.role === "owner").length;
  const renters = d.roles.filter((r) => r.role === "renter").length;
  const activeBookings = d.bookings.filter((b) => b.status === "approved").length;
  const byKind = [
    { name: "Properties", value: d.listings.filter((l) => l.kind === "property").length },
    { name: "Vehicles", value: d.listings.filter((l) => l.kind === "vehicle").length },
    { name: "Equipment", value: d.listings.filter((l) => l.kind === "equipment").length },
  ];
  const pending = d.listings.filter((l) => l.status === "pending").slice(0, 5);
  return (
    <>
      <StatGrid>
        <StatCard icon={Users} label="Total users" value={d.profiles.length} hint={`${owners} owners · ${renters} renters`} />
        <StatCard icon={Building2} label="Live listings" value={live} hint={`${d.listings.length - live} not live`} tone="primary" />
        <StatCard icon={CalendarCheck} label="Active rentals" value={activeBookings} hint={`${d.bookings.filter((b) => b.status === "pending").length} pending requests`} tone="warning" />
        <StatCard icon={Percent} label="Commission earned" value={formatETB(commission)} hint={`on ${formatETB(gmv)} recorded`} />
      </StatGrid>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="New listings — last 6 months"><TrendChart data={seriesByMonth(d.listings, (l) => l.created_at)} /></Panel>
        <Panel title="Listings by type"><DonutChart data={byKind} /></Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Awaiting approval" action={<button className={btn} onClick={() => go("listings")}>View all</button>}>
          {pending.length === 0 ? <Empty text="No listings waiting for review." /> : (
            <ul className="-my-2 divide-y divide-border">
              {pending.map((l) => <PendingRow key={l.id} l={l} />)}
            </ul>
          )}
        </Panel>
        <Panel title="Recent activity" action={<button className={btn} onClick={() => go("audit")}>Audit log</button>}>
          {d.audit.length === 0 && d.bookings.length === 0 ? <Empty text="No activity yet." /> : (
            <ul className="-my-2 divide-y divide-border">
              {[
                ...d.audit.slice(0, 6).map((a) => ({ t: a.created_at, title: a.action.replace(".", " · "), sub: `${a.entity} ${String((a.details as Record<string, unknown>)?.["title"] ?? "")}` })),
                ...d.bookings.slice(0, 4).map((b) => ({ t: b.created_at, title: `New ${b.kind} request`, sub: `${b.renter_name || "Renter"} · ${formatETB(b.total)}` })),
              ].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 7).map((x, i) => (
                <li key={i} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Activity className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium capitalize">{x.title}</p><p className="truncate text-xs text-muted-foreground">{x.sub}</p></div>
                  <span className="text-xs text-muted-foreground">{ago(x.t)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title="Bookings per month"><BarsChart data={seriesByMonth(d.bookings, (b) => b.created_at)} /></Panel>
    </>
  );
}

function PendingRow({ l }: { l: D["listings"][number] }) {
  const act = useAction();
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <Link to="/rentals/$id" params={{ id: l.id }} className="text-sm font-medium hover:text-accent">{l.title}</Link>
        <p className="text-xs text-muted-foreground">{categoryLabel(l.category)} · {l.neighborhood} · {formatETB(l.price)}/{l.price_unit} · {l.owner_name}</p>
      </div>
      <button className={btnAccent} onClick={() => void act(() => supabase.from("listings").update({ status: "approved" }).eq("id", l.id), "Listing approved")}>Approve</button>
      <button className={btnDanger} onClick={() => {
        const reason = window.prompt("Reason for rejection (shown to the owner)");
        if (reason) void act(() => supabase.from("listings").update({ status: "rejected", rejection_reason: reason.slice(0, 300) }).eq("id", l.id), "Listing rejected");
      }}>Reject</button>
    </li>
  );
}

function UsersTab({ d, me }: { d: D; me: string }) {
  const act = useAction();
  const [filter, setFilter] = useState("");
  const roleOf = (id: string) => {
    const rs = d.roles.filter((r) => r.user_id === id).map((r) => r.role);
    return rs.includes("admin") ? "admin" : rs.includes("owner") ? "owner" : "renter";
  };
  const rows = d.profiles.filter((p) => `${p.full_name} ${p.email}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Panel title={`${rows.length} users`} action={<input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search name or email" className={input + " h-8 w-56"} />}>
      <Table head={["User", "Role", "Verification", "Account", "Joined"]}>
        {rows.map((p) => (
          <tr key={p.id}>
            <td className={td}><p className="font-medium">{p.full_name || "—"}</p><p className="text-xs text-muted-foreground">{p.email}</p></td>
            <td className={td}>
              <select disabled={p.id === me} value={roleOf(p.id)} className={input + " h-8 w-28"}
                onChange={(e) => void act(() => supabase.rpc("admin_set_role", { _user_id: p.id, _role: e.target.value as "admin" | "owner" | "renter" }), "Role updated")}>
                <option value="renter">Renter</option><option value="owner">Owner</option><option value="admin">Admin</option>
              </select>
            </td>
            <td className={td}>
              <select value={p.verification_status} className={input + " h-8 w-36"}
                onChange={(e) => void act(() => supabase.from("profiles").update({ verification_status: e.target.value }).eq("id", p.id), "Verification updated")}>
                <option value="not_verified">Not verified</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="failed">Failed</option>
              </select>
            </td>
            <td className={td}>
              <div className="flex items-center gap-2"><Status s={p.account_status} />
                {p.id !== me && <button className={p.account_status === "active" ? btnDanger : btn}
                  onClick={() => void act(() => supabase.from("profiles").update({ account_status: p.account_status === "active" ? "suspended" : "active" }).eq("id", p.id), "Account updated")}>
                  {p.account_status === "active" ? "Suspend" : "Reactivate"}</button>}
              </div>
            </td>
            <td className={td + " text-muted-foreground"}>{fmtDate(p.created_at)}</td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

function ListingsTab({ d }: { d: D }) {
  const act = useAction();
  const [status, setStatus] = useState("pending");
  const rows = d.listings.filter((l) => !status || l.status === status);
  return (
    <Panel title={`${rows.length} listings`} action={
      <div className="flex flex-wrap gap-1">{["pending", "approved", "rejected", "draft", ""].map((s) => (
        <button key={s} onClick={() => setStatus(s)} className={status === s ? btnAccent : btn}>{s || "All"}</button>
      ))}</div>}>
      {rows.length === 0 ? <Empty text="Nothing here." /> : (
        <Table head={["Listing", "Owner", "Price", "Status", "Premium", "Actions"]}>
          {rows.map((l) => (
            <tr key={l.id}>
              <td className={td}><Link to="/rentals/$id" params={{ id: l.id }} className="font-medium hover:text-accent">{l.title}</Link><p className="text-xs text-muted-foreground">{categoryLabel(l.category)} · {l.neighborhood}</p>{l.rejection_reason && <p className="text-xs text-destructive">Reason: {l.rejection_reason}</p>}</td>
              <td className={td}>{l.owner_name}{l.owner_verified && <BadgeCheck className="ml-1 inline h-3.5 w-3.5 text-accent" />}</td>
              <td className={td + " whitespace-nowrap"}>{formatETB(l.price)}/{l.price_unit}</td>
              <td className={td}><Status s={l.status} /></td>
              <td className={td}><input type="checkbox" checked={l.premium} onChange={(e) => void act(() => supabase.from("listings").update({ premium: e.target.checked }).eq("id", l.id), "Premium updated")} aria-label="Premium" /></td>
              <td className={td}>
                <div className="flex flex-wrap gap-1">
                  {l.status !== "approved" && <button className={btnAccent} onClick={() => void act(() => supabase.from("listings").update({ status: "approved" }).eq("id", l.id), "Approved")}>Approve</button>}
                  {l.status !== "rejected" && <button className={btnDanger} onClick={() => { const r = window.prompt("Reason for rejection"); if (r) void act(() => supabase.from("listings").update({ status: "rejected", rejection_reason: r.slice(0, 300) }).eq("id", l.id), "Rejected"); }}>Reject</button>}
                  <button className={btnDanger} onClick={() => { if (window.confirm("Delete this listing permanently?")) void act(() => supabase.from("listings").delete().eq("id", l.id), "Deleted"); }}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

function BookingsTab({ d }: { d: D }) {
  const title = (id: string) => d.listings.find((l) => l.id === id)?.title ?? "Listing";
  return (
    <Panel title={`${d.bookings.length} bookings`}>
      {d.bookings.length === 0 ? <Empty text="No bookings yet." /> : (
        <Table head={["Listing", "Renter", "Type", "Dates", "Total", "Status"]}>
          {d.bookings.map((b) => (
            <tr key={b.id}>
              <td className={td + " font-medium"}>{title(b.listing_id)}</td>
              <td className={td}>{b.renter_name || "—"}</td>
              <td className={td + " capitalize"}>{b.kind}</td>
              <td className={td + " whitespace-nowrap"}>{fmtDate(b.start_date)} → {fmtDate(b.end_date)}</td>
              <td className={td}>{formatETB(b.total)}</td>
              <td className={td}><Status s={b.status} /></td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

function PaymentsTab({ d }: { d: D }) {
  const gmv = d.payments.reduce((s, p) => s + Number(p.amount), 0);
  const com = d.payments.reduce((s, p) => s + Number(p.commission_amount), 0);
  return (
    <>
      <StatGrid>
        <StatCard icon={Banknote} label="Total recorded" value={formatETB(gmv)} />
        <StatCard icon={Percent} label="Commission earned" value={formatETB(com)} tone="primary" />
        <StatCard icon={ListChecks} label="Payments" value={d.payments.length} tone="warning" />
        <StatCard icon={Users} label="Paying renters" value={new Set(d.payments.map((p) => p.renter_id)).size} />
      </StatGrid>
      <Panel title="Commission per month"><BarsChart data={seriesByMonth(d.payments, (p) => p.created_at, (p) => Number(p.commission_amount))} /></Panel>
      <Panel title="All payments">
        {d.payments.length === 0 ? <Empty text="No payments recorded yet." /> : (
          <Table head={["Date", "Amount", "Method", "Reference", "Commission"]}>
            {d.payments.map((p) => (
              <tr key={p.id}><td className={td}>{fmtDate(p.created_at)}</td><td className={td + " font-medium"}>{formatETB(p.amount)}</td><td className={td + " capitalize"}>{p.method.replace("_", " ")}</td><td className={td}>{p.reference || "—"}</td><td className={td}>{formatETB(p.commission_amount)} ({p.commission_rate}%)</td></tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}

function ReportsTab({ d }: { d: D }) {
  const act = useAction();
  return (
    <Panel title={`${d.reports.length} reports`}>
      {d.reports.length === 0 ? <Empty text="No reports filed." /> : (
        <ul className="-my-2 divide-y divide-border">
          {d.reports.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-3 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><Status s={r.status} /><span className="text-xs uppercase text-muted-foreground">{r.kind}</span><span className="text-xs text-muted-foreground">{ago(r.created_at)}</span></div>
                <p className="mt-1 font-medium">{r.reason}</p>
                {r.details && <p className="text-sm text-muted-foreground">{r.details}</p>}
                {r.admin_note && <p className="mt-1 text-xs">Note: {r.admin_note}</p>}
              </div>
              <select value={r.status} className={input + " h-8 w-36"} onChange={(e) => {
                const note = e.target.value === "resolved" || e.target.value === "dismissed" ? window.prompt("Note for the reporter (optional)") ?? "" : r.admin_note;
                void act(() => supabase.from("reports").update({ status: e.target.value, admin_note: note.slice(0, 500) }).eq("id", r.id), "Report updated");
              }}>
                <option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ReviewsTab({ d }: { d: D }) {
  const act = useAction();
  return (
    <Panel title={`${d.reviews.length} reviews`}>
      {d.reviews.length === 0 ? <Empty text="No reviews yet." /> : (
        <Table head={["Reviewer", "Rating", "Comment", "Status", ""]}>
          {d.reviews.map((r) => (
            <tr key={r.id}>
              <td className={td}>{r.reviewer_name}</td><td className={td}>{"★".repeat(r.rating)}</td>
              <td className={td + " max-w-sm"}>{r.comment || "—"}</td>
              <td className={td}><Status s={r.hidden ? "hidden" : "active"} /></td>
              <td className={td}><button className={btn} onClick={() => void act(() => supabase.from("reviews").update({ hidden: !r.hidden }).eq("id", r.id), "Review updated")}>{r.hidden ? "Show" : "Hide"}</button></td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

function CategoriesTab() {
  const act = useAction();
  const { data = [] } = useQuery(q("categories", () => supabase.from("categories").select("*").order("sort")));
  const [form, setForm] = useState({ id: "", label: "", blurb: "", kind: "property" });
  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Panel title="Categories">
        <Table head={["Category", "Type", "Visible"]}>
          {data.map((c) => (
            <tr key={c.id}>
              <td className={td}><p className="font-medium">{c.label}</p><p className="text-xs text-muted-foreground">{c.blurb}</p></td>
              <td className={td + " capitalize"}>{c.kind}</td>
              <td className={td}><input type="checkbox" checked={c.active} onChange={(e) => void act(() => supabase.from("categories").update({ active: e.target.checked }).eq("id", c.id), "Category updated")} aria-label="Visible" /></td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Add category">
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          const id = form.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
          if (!id || !form.label.trim()) return;
          void act(() => supabase.from("categories").insert({ id, label: form.label.trim(), blurb: form.blurb.trim(), kind: form.kind, sort: data.length + 1 }), "Category added")
            .then((ok) => ok && setForm({ id: "", label: "", blurb: "", kind: "property" }));
        }}>
          <input required placeholder="ID (e.g. motorbike)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className={input} />
          <input required placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={input} />
          <input placeholder="Short description" value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} className={input} />
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={input}>
            <option value="property">Property</option><option value="vehicle">Vehicle</option><option value="equipment">Equipment</option>
          </select>
          <button className={btnAccent + " h-9 w-full justify-center"}>Add category</button>
        </form>
      </Panel>
    </div>
  );
}

function SettingsTab() {
  const act = useAction();
  const { data } = useQuery({ queryKey: ["admin", "settings"], queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data });
  if (!data) return null;
  return (
    <Panel title="Platform settings" className="max-w-xl">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void act(() => supabase.from("platform_settings").update({
          commission_rate: Number(f.get("commission_rate")), premium_fee: Number(f.get("premium_fee")), support_email: String(f.get("support_email")),
        }).eq("id", 1), "Settings saved");
      }}>
        <label className="block text-sm font-medium">Commission rate (%) — between 2 and 5
          <input name="commission_rate" type="number" step="0.5" min={2} max={5} defaultValue={data.commission_rate} className={input + " mt-1"} /></label>
        <label className="block text-sm font-medium">Premium listing fee (ETB)
          <input name="premium_fee" type="number" min={0} defaultValue={data.premium_fee} className={input + " mt-1"} /></label>
        <label className="block text-sm font-medium">Support email
          <input name="support_email" type="email" defaultValue={data.support_email} className={input + " mt-1"} /></label>
        <p className="text-xs text-muted-foreground">Last updated {fmtDate(data.updated_at)}</p>
        <button className={btnAccent + " h-9"}>Save settings</button>
      </form>
    </Panel>
  );
}

function AuditTab({ d }: { d: D }) {
  const who = (id: string | null) => d.profiles.find((p) => p.id === id)?.full_name || "System";
  return (
    <Panel title="Audit log">
      {d.audit.length === 0 ? <Empty text="No admin actions recorded yet." /> : (
        <Table head={["When", "Who", "Action", "Target"]}>
          {d.audit.map((a) => (
            <tr key={a.id}><td className={td + " whitespace-nowrap text-muted-foreground"}>{ago(a.created_at)}</td><td className={td}>{who(a.actor_id)}</td><td className={td + " font-medium"}>{a.action}</td><td className={td + " text-muted-foreground"}>{a.entity} {String((a.details as Record<string, unknown>)?.["title"] ?? "")}</td></tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

const PLAN_NAMES: Record<string, string> = { business_basic: "Business Basic", business_pro: "Business Pro" };

function SubscriptionsTab({ d }: { d: D }) {
  const act = useAction();
  const { data: subs = [] } = useQuery(q("subscriptions", () => supabase.from("subscriptions").select("*").order("created_at", { ascending: false })));
  const owners = d.profiles.filter((p) => d.roles.some((r) => r.user_id === p.id && r.role === "owner"));
  const name = (id: string) => d.profiles.find((p) => p.id === id)?.full_name || "Owner";
  const billing = d.reports.filter((r) => r.reason.startsWith("Billing:") && (r.status === "open" || r.status === "reviewing"));
  const featured = d.listings.filter((l) => l.premium);
  return (
    <div className="space-y-6">
      <Panel title={`Open billing requests (${billing.length})`}>
        {billing.length === 0 ? <Empty text="No pending plan or featured requests." /> : (
          <ul className="-my-2 divide-y divide-border">{billing.map((r) => {
            const listing = d.listings.find((l) => l.id === r.listing_id);
            const plan = r.reason.includes("Business Pro") ? "business_pro" : r.reason.includes("Business Basic") ? "business_basic" : null;
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-3">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{r.reason.replace("Billing: ", "")}</p><p className="text-xs text-muted-foreground">{name(r.reporter_id)} · {ago(r.created_at)}</p></div>
                {listing && <button className={btnAccent} onClick={() => void act(async () => {
                  const res = await supabase.from("listings").update({ premium: true }).eq("id", listing.id);
                  if (res.error) return res;
                  return supabase.from("reports").update({ status: "resolved", admin_note: "Payment confirmed — your listing is now featured." }).eq("id", r.id);
                }, "Listing featured")}>Confirm & feature</button>}
                {plan && <button className={btnAccent} onClick={() => void act(async () => {
                  const ends = new Date(); ends.setMonth(ends.getMonth() + 1);
                  const res = await supabase.from("subscriptions").insert({ owner_id: r.reporter_id, plan, ends_at: ends.toISOString(), notes: "Activated from owner request" });
                  if (res.error) return res;
                  return supabase.from("reports").update({ status: "resolved", admin_note: `Payment confirmed — ${PLAN_NAMES[plan]} is active.` }).eq("id", r.id);
                }, "Plan activated")}>Confirm & activate</button>}
                <button className={btnDanger} onClick={() => { const n = window.prompt("Reason for declining"); if (n) void act(() => supabase.from("reports").update({ status: "dismissed", admin_note: n.slice(0, 300) }).eq("id", r.id), "Request declined"); }}>Decline</button>
              </li>
            );
          })}</ul>
        )}
      </Panel>
      <Panel title="Grant a business plan">
        <form className="grid gap-2 sm:grid-cols-[2fr_1.5fr_0.7fr_1.5fr_auto]" onSubmit={(e) => {
          e.preventDefault(); const f = new FormData(e.currentTarget);
          const months = Number(f.get("months") || 1); const ends = new Date(); ends.setMonth(ends.getMonth() + months);
          void act(() => supabase.from("subscriptions").insert({ owner_id: String(f.get("owner")), plan: String(f.get("plan")), ends_at: ends.toISOString(), notes: String(f.get("notes") ?? "") }), "Plan activated");
        }}>
          <select name="owner" required className={input}><option value="">Choose owner</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.full_name || o.id.slice(0, 8)}</option>)}</select>
          <select name="plan" className={input}><option value="business_basic">Business Basic</option><option value="business_pro">Business Pro</option></select>
          <input name="months" type="number" min={1} max={24} defaultValue={1} className={input} aria-label="Months" />
          <input name="notes" placeholder="Payment reference" className={input} />
          <button className={btnAccent + " h-9"}>Activate</button>
        </form>
      </Panel>
      <Panel title={`${subs.length} subscriptions`}>
        {subs.length === 0 ? <Empty text="No subscriptions yet." /> : (
          <Table head={["Owner", "Plan", "Status", "Started", "Ends", ""]}>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className={td}>{name(s.owner_id)}</td><td className={td + " font-medium"}>{PLAN_NAMES[s.plan] ?? s.plan}</td><td className={td}><Status s={s.status} /></td>
                <td className={td}>{fmtDate(s.starts_at)}</td><td className={td}>{s.ends_at ? fmtDate(s.ends_at) : "—"}</td>
                <td className={td}>{s.status === "active" && <button className={btnDanger} onClick={() => { if (window.confirm("Cancel this plan?")) void act(() => supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", s.id), "Plan cancelled"); }}>Cancel</button>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      <Panel title={`${featured.length} featured listings`}>
        {featured.length === 0 ? <Empty text="No featured listings." /> : (
          <ul className="-my-2 divide-y divide-border">{featured.map((l) => (
            <li key={l.id} className="flex items-center gap-2 py-2"><span className="flex-1 text-sm font-medium">{l.title}</span><span className="text-xs text-muted-foreground">{l.owner_name}</span>
              <button className={btn} onClick={() => void act(() => supabase.from("listings").update({ premium: false }).eq("id", l.id), "Removed from featured")}>Unfeature</button></li>
          ))}</ul>
        )}
      </Panel>
    </div>
  );
}
