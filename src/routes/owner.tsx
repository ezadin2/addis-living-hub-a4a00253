import { AgreementQR } from "@/components/dash/AgreementQR";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Banknote, BadgeCheck, Bell, CalendarCheck, Crown, Eye, FileSignature, Home, ImagePlus, LayoutDashboard, ListPlus, MessageSquare, Plus, Sparkles, Star,
} from "lucide-react";
import { DashShell, useRoleGate, type NavGroup } from "@/components/dash/DashShell";
import {
  BarsChart, DonutChart, Empty, NotificationsPanel, Panel, StatCard, StatGrid, Status, Table, TrendChart,
  ago, btn, btnAccent, btnDanger, fmtDate, input, seriesByMonth, td, useAction,
} from "@/components/dash/parts";
import { VerificationBadge } from "@/components/site/VerificationBadge";
import { supabase } from "@/integrations/supabase/client";
import { AMENITIES_BY_KIND, CATEGORIES, IMAGE_CHOICES, NEIGHBORHOODS, categoryLabel, formatETB, imageUrl, listingImages, type Kind, type Listing } from "@/lib/listings";
import { MAX_PHOTOS, compressPhoto } from "@/lib/photos";

type Tab = "overview" | "listings" | "new" | "requests" | "agreements" | "payments" | "reviews" | "plans" | "notifications";

export const Route = createFileRoute("/owner")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => (typeof s["tab"] === "string" ? { tab: s["tab"] as Tab } : {}),
  head: () => ({
    meta: [
      { title: "Owner workspace — FaydaRent" },
      { name: "description", content: "Manage your listings, rental requests, agreements and payments." },
      { property: "og:title", content: "Owner workspace — FaydaRent" },
      { property: "og:description", content: "Everything an owner needs to rent out homes, vehicles and equipment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerPage,
});

function useOwnerData(uid: string | null) {
  const opt = <T,>(key: string, fn: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) => ({
    queryKey: ["owner", key, uid], enabled: !!uid,
    queryFn: async () => { const { data, error } = await fn(); if (error) throw new Error(error.message); return data ?? []; },
  });
  const listings = useQuery(opt("listings", () => supabase.from("listings").select("*").eq("owner_id", uid!).order("created_at", { ascending: false })));
  const bookings = useQuery(opt("bookings", () => supabase.from("bookings").select("*").eq("owner_id", uid!).order("created_at", { ascending: false })));
  const agreements = useQuery(opt("agreements", () => supabase.from("agreements").select("*").eq("owner_id", uid!).order("created_at", { ascending: false })));
  const payments = useQuery(opt("payments", () => supabase.from("payments").select("*").eq("owner_id", uid!).order("created_at", { ascending: false })));
  const profile = useQuery({ queryKey: ["owner", "profile", uid], enabled: !!uid, queryFn: async () => (await supabase.from("profiles").select("*").eq("id", uid!).single()).data });
  const ids = (listings.data ?? []).map((l) => l.id);
  const reviews = useQuery({
    queryKey: ["owner", "reviews", ids.join()], enabled: ids.length > 0,
    queryFn: async () => (await supabase.from("reviews").select("*").in("listing_id", ids).order("created_at", { ascending: false })).data ?? [],
  });
  return {
    listings: listings.data ?? [], bookings: bookings.data ?? [], agreements: agreements.data ?? [],
    payments: payments.data ?? [], reviews: reviews.data ?? [], profile: profile.data,
  };
}
type D = ReturnType<typeof useOwnerData>;

function OwnerPage() {
  const gate = useRoleGate("owner");
  const { tab = "overview" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const d = useOwnerData(gate.userId);
  if (!gate.ready) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading your workspace…</div>;
  const go = (t: Tab) => void navigate({ search: { tab: t } });
  const pending = d.bookings.filter((b) => b.status === "pending").length;
  const groups: NavGroup[] = [
    { title: "Main", items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "notifications", label: "Notifications", icon: Bell },
    ] },
    { title: "My rentals", items: [
      { id: "listings", label: "My listings", icon: Home },
      { id: "new", label: "Add listing", icon: ListPlus },
      { id: "requests", label: "Requests", icon: MessageSquare, badge: pending },
    ] },
    { title: "Business", items: [
      { id: "agreements", label: "Agreements", icon: FileSignature },
      { id: "payments", label: "Payments & earnings", icon: Banknote },
      { id: "reviews", label: "Reviews", icon: Star },
      { id: "plans", label: "Featured & plans", icon: Crown },
    ] },
  ];
  const titles: Record<Tab, [string, string]> = {
    overview: [`Hello, ${gate.name.split(" ")[0] || "Owner"}`, "Your listings, requests and earnings at a glance."],
    listings: ["My listings", "Homes, vehicles and equipment you rent out."],
    new: ["Add a listing", "Submitted listings are reviewed by our team before going live."],
    requests: ["Rental requests", "Accept, decline or complete requests from renters."],
    agreements: ["Agreements", "Draft and share written rental agreements."],
    payments: ["Payments & earnings", "Record payments received and track your income."],
    reviews: ["Reviews", "What renters say about your listings."],
    plans: ["Featured listings & business plans", "Get more visibility, or rent at scale with a monthly plan."],
    notifications: ["Notifications", "Updates about your listings and renters."],
  };
  return (
    <DashShell role="owner" groups={groups} active={tab} onSelect={(t) => go(t as Tab)} title={titles[tab][0]} subtitle={titles[tab][1]}
      actions={tab !== "new" && <button className={btnAccent} onClick={() => go("new")}><Plus className="h-3.5 w-3.5" />Add listing</button>}>
      {tab === "overview" && <Overview d={d} go={go} />}
      {tab === "listings" && <ListingsTab d={d} go={go} uid={gate.userId!} />}
      {tab === "new" && <NewListing uid={gate.userId!} done={() => go("listings")} />}
      {tab === "requests" && <RequestsTab d={d} />}
      {tab === "agreements" && <AgreementsTab d={d} />}
      {tab === "payments" && <PaymentsTab d={d} />}
      {tab === "reviews" && <ReviewsTab d={d} />}
      {tab === "plans" && <PlansTab d={d} uid={gate.userId!} />}
      {tab === "notifications" && <NotificationsPanel />}
    </DashShell>
  );
}

function Overview({ d, go }: { d: D; go: (t: Tab) => void }) {
  const live = d.listings.filter((l) => l.status === "approved").length;
  const earned = d.payments.reduce((s, p) => s + Number(p.amount) - Number(p.commission_amount), 0);
  const views = d.listings.reduce((s, l) => s + l.views, 0);
  const avg = d.reviews.length ? (d.reviews.reduce((s, r) => s + r.rating, 0) / d.reviews.length).toFixed(1) : "—";
  const pending = d.bookings.filter((b) => b.status === "pending").slice(0, 5);
  const title = (id: string) => d.listings.find((l) => l.id === id)?.title ?? "Listing";
  const statusMix = ["approved", "pending", "draft", "rejected"].map((s) => ({ name: s[0]!.toUpperCase() + s.slice(1), value: d.listings.filter((l) => l.status === s).length }));
  return (
    <>
      {d.profile && d.profile.verification_status !== "verified" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4">
          <div><p className="font-semibold">Verify your identity</p><p className="text-sm text-muted-foreground">Verified owners get more requests and a badge on every listing.</p></div>
          <div className="flex items-center gap-3"><VerificationBadge status={d.profile.verification_status as "not_verified"} /><Link to="/verify" className={btnAccent}>Start verification</Link></div>
        </div>
      )}
      <StatGrid>
        <StatCard icon={Home} label="Live listings" value={live} hint={`${d.listings.length} total`} />
        <StatCard icon={MessageSquare} label="Pending requests" value={d.bookings.filter((b) => b.status === "pending").length} tone="warning" />
        <StatCard icon={Banknote} label="Net earnings" value={formatETB(earned)} hint="after platform commission" tone="primary" />
        <StatCard icon={Star} label="Average rating" value={avg} hint={`${d.reviews.length} reviews · ${views} views`} />
      </StatGrid>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Earnings — last 6 months"><TrendChart data={seriesByMonth(d.payments, (p) => p.created_at, (p) => Number(p.amount) - Number(p.commission_amount))} /></Panel>
        <Panel title="Listing status"><DonutChart data={statusMix} /></Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Requests waiting for you" action={<button className={btn} onClick={() => go("requests")}>View all</button>}>
          {pending.length === 0 ? <Empty text="No pending requests right now." /> : (
            <ul className="-my-2 divide-y divide-border">
              {pending.map((b) => <RequestRow key={b.id} b={b} title={title(b.listing_id)} />)}
            </ul>
          )}
        </Panel>
        <Panel title="Top listings by views" action={<button className={btn} onClick={() => go("listings")}>Manage</button>}>
          {d.listings.length === 0 ? <Empty text="You haven't listed anything yet."><button className={btnAccent} onClick={() => go("new")}>Add your first listing</button></Empty> : (
            <ul className="-my-2 divide-y divide-border">
              {[...d.listings].sort((a, b) => b.views - a.views).slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{l.title}</p><p className="text-xs text-muted-foreground">{categoryLabel(l.category)} · {formatETB(l.price)}/{l.price_unit}</p></div>
                  <Status s={l.status} /><span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3.5 w-3.5" />{l.views}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title="Requests received per month"><BarsChart data={seriesByMonth(d.bookings, (b) => b.created_at)} /></Panel>
    </>
  );
}

function RequestRow({ b, title }: { b: D["bookings"][number]; title: string }) {
  const act = useAction();
  const set = (status: string) => {
    const note = window.prompt(status === "approved" ? "Message to renter (optional)" : "Reason (optional)") ?? "";
    void act(() => supabase.from("bookings").update({ status, owner_note: note.slice(0, 300) }).eq("id", b.id), `Request ${status}`);
  };
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{b.renter_name || "Renter"} · <span className="capitalize">{b.kind}</span></p>
        <p className="text-xs text-muted-foreground">{title} · {fmtDate(b.start_date)} → {fmtDate(b.end_date)} · {formatETB(b.total)}</p>
        {b.message && <p className="mt-0.5 text-xs italic text-muted-foreground">“{b.message}”</p>}
      </div>
      <button className={btnAccent} onClick={() => set("approved")}>Accept</button>
      <button className={btnDanger} onClick={() => set("declined")}>Decline</button>
    </li>
  );
}

function ListingsTab({ d, go, uid }: { d: D; go: (t: Tab) => void; uid: string }) {
  const act = useAction();
  const [editing, setEditing] = useState<Listing | null>(null);
  if (editing) return <NewListing uid={uid} existing={editing} done={() => setEditing(null)} />;
  if (d.listings.length === 0) return <Panel title="My listings"><Empty text="No listings yet."><button className={btnAccent} onClick={() => go("new")}>Add listing</button></Empty></Panel>;
  return (
    <Panel title={`${d.listings.length} listings`}>
      <Table head={["Listing", "Price", "Status", "Available", "Views", "Actions"]}>
        {d.listings.map((l) => (
          <tr key={l.id}>
            <td className={td}>
              <div className="flex items-center gap-3">
                <img src={listingImages(l)[0]} alt="" className="h-10 w-14 shrink-0 rounded-md bg-muted object-cover" />
                <div className="min-w-0"><Link to="/rentals/$id" params={{ id: l.id }} className="font-medium hover:text-accent">{l.title}</Link><p className="text-xs text-muted-foreground">{categoryLabel(l.category)} · {l.neighborhood}</p>{l.rejection_reason && <p className="text-xs text-destructive">Rejected: {l.rejection_reason}</p>}</div>
              </div>
            </td>
            <td className={td + " whitespace-nowrap"}>{formatETB(l.price)}/{l.price_unit}</td>
            <td className={td}><Status s={l.status} />{l.premium && <span className="ml-1 text-[11px] font-semibold text-accent">Featured</span>}</td>
            <td className={td}><input type="checkbox" checked={l.available} onChange={(e) => void act(() => supabase.from("listings").update({ available: e.target.checked }).eq("id", l.id), "Availability updated")} aria-label="Available" /></td>
            <td className={td}>{l.views}</td>
            <td className={td}>
              <div className="flex flex-wrap gap-1">
                {(l.status === "draft" || l.status === "rejected") && <button className={btnAccent} onClick={() => void act(() => supabase.from("listings").update({ status: "pending" }).eq("id", l.id), "Submitted for review")}>Submit</button>}
                <button className={btn} onClick={() => setEditing(l)}>Edit</button>
                {l.status === "approved" && !l.premium && <button className={btn} onClick={() => go("plans")}>Feature it</button>}
                <button className={btnDanger} onClick={() => { if (window.confirm("Delete this listing?")) void act(() => supabase.from("listings").delete().eq("id", l.id), "Listing deleted"); }}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

const PLANS = [
  { id: "business_basic", name: "Business Basic", price: 1500, perks: ["Up to 15 active listings", "Bulk request management", "Monthly earnings report"] },
  { id: "business_pro", name: "Business Pro", price: 4000, perks: ["Unlimited listings", "2 featured listings included", "Priority support & dedicated contact"] },
] as const;

function PlansTab({ d, uid }: { d: D; uid: string }) {
  const act = useAction();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data });
  const { data: subs = [] } = useQuery({ queryKey: ["owner", "subs", uid], queryFn: async () => (await supabase.from("subscriptions").select("*").eq("owner_id", uid).order("created_at", { ascending: false })).data ?? [] });
  const { data: requests = [] } = useQuery({ queryKey: ["owner", "billing", uid], queryFn: async () => (await supabase.from("reports").select("*").eq("reporter_id", uid).eq("kind", "support").like("reason", "Billing:%").order("created_at", { ascending: false })).data ?? [] });
  const active = subs.find((s) => s.status === "active");
  const request = (reason: string, details: string, listingId: string | null = null) =>
    act(() => supabase.from("reports").insert({ reporter_id: uid, kind: "support", reason, details, listing_id: listingId }), "Request sent — our team will confirm payment and activate it");
  const featurable = d.listings.filter((l) => l.status === "approved" && !l.premium);
  return (
    <div className="space-y-6">
      <Panel title="Featured listings">
        <p className="text-sm text-muted-foreground">Featured listings appear first on the homepage and in search, with a Featured label. Fee: <span className="font-semibold text-foreground">{formatETB(settings?.premium_fee ?? 0)}</span> per listing per month.</p>
        {featurable.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">You have no approved listings left to feature.</p> : (
          <ul className="mt-3 divide-y divide-border">
            {featurable.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-sm font-medium">{l.title}</span>
                <button className={btnAccent} onClick={() => void request(`Billing: Feature "${l.title.slice(0, 150)}"`, `Owner requests featured placement. Fee ${settings?.premium_fee ?? 0} ETB/month.`, l.id)}><Sparkles className="h-3.5 w-3.5" />Request featured</button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Business subscriptions">
        {active && <p className="mb-4 rounded-md bg-accent-soft p-3 text-sm">Current plan: <span className="font-semibold">{PLANS.find((p) => p.id === active.plan)?.name}</span> · since {fmtDate(active.starts_at)}{active.ends_at && ` · until ${fmtDate(active.ends_at)}`}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANS.map((p) => (
            <div key={p.id} className="rounded-xl border border-border p-4">
              <p className="font-semibold">{p.name}</p>
              <p className="mt-1 font-display text-2xl font-bold">{formatETB(p.price)}<span className="text-xs font-medium text-muted-foreground"> /month</span></p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{p.perks.map((x) => <li key={x}>• {x}</li>)}</ul>
              <button disabled={active?.plan === p.id} className={btnAccent + " mt-4 h-9 w-full justify-center"} onClick={() => void request(`Billing: Subscribe to ${p.name}`, `Owner requests the ${p.id} plan at ${p.price} ETB/month.`)}>{active?.plan === p.id ? "Your plan" : "Request this plan"}</button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Payment is made by bank transfer or telebirr. Our team activates the plan once payment is confirmed.</p>
      </Panel>
      {requests.length > 0 && (
        <Panel title="Your billing requests">
          <ul className="-my-2 divide-y divide-border">{requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 py-3"><Status s={r.status} /><span className="text-sm">{r.reason.replace("Billing: ", "")}</span><span className="text-xs text-muted-foreground">{ago(r.created_at)}</span>{r.admin_note && <p className="w-full text-xs text-muted-foreground">Team: {r.admin_note}</p>}</li>
          ))}</ul>
        </Panel>
      )}
    </div>
  );
}

function PhotoPicker({ photos, setPhotos }: { photos: string[]; setPhotos: (p: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <fieldset>
      <legend className="text-sm font-medium">Photos <span className="font-normal text-muted-foreground">({photos.length}/{MAX_PHOTOS}) — the first photo is the cover</span></legend>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((p, i) => (
          <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
            <img src={imageUrl(p)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-card/90 p-0.5 text-[11px]">
              {i > 0 ? <button type="button" onClick={() => setPhotos([p, ...photos.filter((_, j) => j !== i)])}>Cover</button> : <span className="font-semibold text-accent">Cover</span>}
              <button type="button" className="text-destructive" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-input text-center text-xs text-muted-foreground hover:border-accent">
            <span><ImagePlus className="mx-auto h-5 w-5" />{busy ? "Processing…" : "Add photos"}</span>
            <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={async (e) => {
              const files = [...(e.target.files ?? [])].slice(0, MAX_PHOTOS - photos.length);
              e.target.value = "";
              setBusy(true);
              try { setPhotos([...photos, ...(await Promise.all(files.map((f) => compressPhoto(f))))]); }
              catch (err) { toast.error(err instanceof Error ? err.message : "Could not read photo"); }
              setBusy(false);
            }} />
          </label>
        )}
      </div>
    </fieldset>
  );
}

function NewListing({ uid, done, existing }: { uid: string; done: () => void; existing?: Listing }) {
  const act = useAction();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>((existing?.kind as Kind) ?? "property");
  const [photos, setPhotos] = useState<string[]>(existing?.images.filter((i) => i.trim()) ?? []);
  const [busy, setBusy] = useState(false);
  const v = existing;
  const submit = async (e: React.FormEvent<HTMLFormElement>, status: "draft" | "pending") => {
    e.preventDefault();
    const f = new FormData((e.currentTarget as HTMLElement & { form?: HTMLFormElement })["form"] ?? e.currentTarget);
    const n = (k: string) => (f.get(k) ? Number(f.get(k)) : null);
    const s = (k: string) => (f.get(k) ? String(f.get(k)).trim() : null);
    if (status === "pending" && photos.length === 0) { toast.error("Add at least one photo before submitting for review"); return; }
    const row = {
      kind, category: s("category")!, title: s("title")!.slice(0, 120), description: (s("description") ?? "").slice(0, 2000),
      neighborhood: s("neighborhood") ?? "", price: n("price") ?? 0, price_unit: kind === "property" ? "month" : "day",
      bedrooms: n("bedrooms") ?? 0, bathrooms: n("bathrooms") ?? 0, size_sqm: n("size_sqm"), furnishing: s("furnishing"),
      min_term: n("min_term") ?? 1, deposit: s("deposit"), make: s("make"), model: s("model"), year: n("year"), seats: n("seats"),
      transmission: s("transmission"), fuel: s("fuel"), with_operator: f.get("with_operator") === "on", contact_phone: s("contact_phone"),
      amenities: f.getAll("amenities").map(String), images: photos.length ? photos : IMAGE_CHOICES[kind],
    };
    setBusy(true);
    const ok = await act(
      () => v ? supabase.from("listings").update({ ...row, status }).eq("id", v.id) : supabase.from("listings").insert({ ...row, owner_id: uid, status }),
      status === "draft" ? "Saved as draft" : v ? "Changes submitted for review" : "Submitted for review",
    );
    setBusy(false);
    if (ok) { void qc.invalidateQueries({ queryKey: ["listings"] }); done(); }
  };
  const lbl = "block text-sm font-medium";
  return (
    <Panel title={v ? `Edit: ${v.title}` : "Listing details"} className="max-w-3xl">
      <form key={kind} className="space-y-5" onSubmit={(e) => void submit(e, "pending")}>
        <div className="grid grid-cols-3 gap-2">
          {(["property", "vehicle", "equipment"] as Kind[]).map((k) => (
            <button type="button" key={k} onClick={() => setKind(k)} className={`rounded-lg border p-3 text-sm font-semibold capitalize ${kind === k ? "border-accent bg-accent-soft text-accent" : "border-input"}`}>{k}</button>
          ))}
        </div>
        <PhotoPicker photos={photos} setPhotos={setPhotos} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={lbl}>Category<select name="category" required defaultValue={v?.category} className={input + " mt-1"}>{CATEGORIES.filter((c) => c.kind === kind).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label className={lbl}>Neighborhood / location<input name="neighborhood" required defaultValue={v?.neighborhood} list="owner-neighborhoods" maxLength={80} placeholder="Pick or type, e.g. Lebu" className={input + " mt-1"} /><datalist id="owner-neighborhoods">{NEIGHBORHOODS.map((n) => <option key={n} value={n} />)}</datalist></label>
          <label className={lbl + " sm:col-span-2"}>Title<input name="title" required defaultValue={v?.title} maxLength={120} className={input + " mt-1"} /></label>
          <label className={lbl + " sm:col-span-2"}>Description<textarea name="description" defaultValue={v?.description} rows={3} maxLength={2000} className={input + " mt-1 h-auto py-2"} /></label>
          <label className={lbl}>{kind === "property" ? "Monthly rent (ETB)" : "Price per day (ETB)"}<input name="price" type="number" min={1} required defaultValue={v?.price} className={input + " mt-1"} /></label>
          <label className={lbl}>Contact phone<input name="contact_phone" defaultValue={v?.contact_phone ?? ""} maxLength={20} className={input + " mt-1"} /></label>
          {kind === "property" && <>
            <label className={lbl}>Bedrooms<input name="bedrooms" type="number" min={0} defaultValue={v?.bedrooms ?? 1} className={input + " mt-1"} /></label>
            <label className={lbl}>Bathrooms<input name="bathrooms" type="number" min={0} defaultValue={v?.bathrooms ?? 1} className={input + " mt-1"} /></label>
            <label className={lbl}>Size (m²)<input name="size_sqm" type="number" min={1} defaultValue={v?.size_sqm ?? ""} className={input + " mt-1"} /></label>
            <label className={lbl}>Furnishing<select name="furnishing" defaultValue={v?.furnishing ?? "unfurnished"} className={input + " mt-1"}><option value="unfurnished">Unfurnished</option><option value="semi-furnished">Semi-furnished</option><option value="furnished">Furnished</option></select></label>
            <label className={lbl}>Minimum term (months)<input name="min_term" type="number" min={1} defaultValue={v?.min_term ?? 1} className={input + " mt-1"} /></label>
            <label className={lbl}>Deposit<input name="deposit" defaultValue={v?.deposit ?? ""} placeholder="e.g. 2 months" className={input + " mt-1"} /></label>
          </>}
          {kind !== "property" && <>
            <label className={lbl}>Make<input name="make" defaultValue={v?.make ?? ""} className={input + " mt-1"} /></label>
            <label className={lbl}>Model<input name="model" defaultValue={v?.model ?? ""} className={input + " mt-1"} /></label>
            <label className={lbl}>Year<input name="year" type="number" min={1980} max={2030} defaultValue={v?.year ?? ""} className={input + " mt-1"} /></label>
            {kind === "vehicle" && <>
              <label className={lbl}>Seats<input name="seats" type="number" min={1} defaultValue={v?.seats ?? ""} className={input + " mt-1"} /></label>
              <label className={lbl}>Transmission<select name="transmission" defaultValue={v?.transmission ?? "automatic"} className={input + " mt-1"}><option value="automatic">Automatic</option><option value="manual">Manual</option></select></label>
              <label className={lbl}>Fuel<select name="fuel" defaultValue={v?.fuel ?? "petrol"} className={input + " mt-1"}><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="electric">Electric</option></select></label>
            </>}
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" name="with_operator" defaultChecked={v?.with_operator} /> {kind === "vehicle" ? "Driver included" : "Operator included"}</label>
          </>}
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Features</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMENITIES_BY_KIND[kind].map((a) => <label key={a} className="flex items-center gap-2 text-sm"><input type="checkbox" name="amenities" value={a} defaultChecked={v?.amenities.includes(a)} />{a}</label>)}
          </div>
        </fieldset>
        {v?.status === "approved" && <p className="text-xs text-muted-foreground">Changing the title, description, price, photos or category sends the listing back for a quick review.</p>}
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <button disabled={busy} className={btnAccent + " h-9"}><BadgeCheck className="h-4 w-4" />{v ? "Save & submit" : "Submit for review"}</button>
          <button type="button" disabled={busy} className={btn + " h-9"} onClick={(e) => {
            const form = (e.currentTarget as HTMLButtonElement).form!;
            if (!form.reportValidity()) return;
            void submit({ preventDefault() {}, currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>, "draft");
          }}>Save as draft</button>
          {v && <button type="button" className={btn + " h-9"} onClick={done}>Cancel</button>}
        </div>
      </form>
    </Panel>
  );
}

function RequestsTab({ d }: { d: D }) {
  const act = useAction();
  const title = (id: string) => d.listings.find((l) => l.id === id)?.title ?? "Listing";
  if (d.bookings.length === 0) return <Panel title="Requests"><Empty text="No requests yet. They'll appear here when renters book." /></Panel>;
  return (
    <Panel title={`${d.bookings.length} requests`}>
      <Table head={["Renter", "Listing", "Dates", "Total", "Status", "Actions"]}>
        {d.bookings.map((b) => (
          <tr key={b.id}>
            <td className={td}><p className="font-medium">{b.renter_name || "Renter"}</p><p className="text-xs text-muted-foreground">{b.phone} · {ago(b.created_at)}</p></td>
            <td className={td}>{title(b.listing_id)}<p className="text-xs capitalize text-muted-foreground">{b.kind}</p></td>
            <td className={td + " whitespace-nowrap"}>{fmtDate(b.start_date)} → {fmtDate(b.end_date)}</td>
            <td className={td}>{formatETB(b.total)}</td>
            <td className={td}><Status s={b.status} /></td>
            <td className={td}>
              <div className="flex flex-wrap gap-1">
                {b.status === "pending" && <>
                  <button className={btnAccent} onClick={() => void act(() => supabase.from("bookings").update({ status: "approved" }).eq("id", b.id), "Request accepted")}>Accept</button>
                  <button className={btnDanger} onClick={() => void act(() => supabase.from("bookings").update({ status: "declined", owner_note: (window.prompt("Reason (optional)") ?? "").slice(0, 300) }).eq("id", b.id), "Request declined")}>Decline</button>
                </>}
                {b.status === "approved" && <button className={btn} onClick={() => void act(() => supabase.from("bookings").update({ status: "completed" }).eq("id", b.id), "Marked complete")}>Mark complete</button>}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

function AgreementsTab({ d }: { d: D }) {
  const act = useAction();
  const title = (id: string) => d.listings.find((l) => l.id === id)?.title ?? "Listing";
  const without = d.bookings.filter((b) => (b.status === "approved" || b.status === "completed") && b.kind === "rental" && !d.agreements.some((a) => a.booking_id === b.id));
  const draft = (b: D["bookings"][number]) => {
    const l = d.listings.find((x) => x.id === b.listing_id);
    const terms = `RENTAL AGREEMENT\n\nItem: ${l?.title ?? "Listing"} (${l?.neighborhood ?? ""}, ${l?.city ?? "Addis Ababa"})\nRenter: ${b.renter_name}\nPeriod: ${b.start_date} to ${b.end_date}\nTotal: ${formatETB(b.total)}\nDeposit: ${l?.deposit ?? "As agreed"}\n\n1. The renter will use the item with care and return it in the same condition.\n2. Payment is due before the start date unless agreed otherwise.\n3. Either party may report a dispute through FaydaRent.`;
    void act(() => supabase.from("agreements").insert({ booking_id: b.id, listing_id: b.listing_id, owner_id: b.owner_id!, renter_id: b.renter_id, terms }), "Agreement drafted");
  };
  return (
    <>
      {without.length > 0 && (
        <Panel title="Accepted rentals without an agreement">
          <ul className="-my-2 divide-y divide-border">
            {without.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-3">
                <div className="flex-1"><p className="text-sm font-medium">{title(b.listing_id)}</p><p className="text-xs text-muted-foreground">{b.renter_name} · {fmtDate(b.start_date)} → {fmtDate(b.end_date)}</p></div>
                <button className={btnAccent} onClick={() => draft(b)}><FileSignature className="h-3.5 w-3.5" />Draft agreement</button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <Panel title="Agreements">
        {d.agreements.length === 0 ? <Empty text="No agreements yet. Accept a rental request first." /> : (
          <div className="space-y-4">
            {d.agreements.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2"><p className="flex-1 font-medium">{title(a.listing_id)}</p><Status s={a.status} /></div>
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-xs">{a.terms}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status === "draft" && <>
                    <button className={btn} onClick={() => { const t = window.prompt("Edit terms", a.terms); if (t) void act(() => supabase.from("agreements").update({ terms: t.slice(0, 8000) }).eq("id", a.id), "Terms updated"); }}>Edit terms</button>
                    <button className={btnAccent} onClick={() => void act(() => supabase.from("agreements").update({ status: "shared" }).eq("id", a.id), "Shared with renter")}>Share with renter</button>
                  </>}
                  {(a.status === "draft" || a.status === "shared") && <button className={btnDanger} onClick={() => void act(() => supabase.from("agreements").update({ status: "cancelled" }).eq("id", a.id), "Agreement cancelled")}>Cancel</button>}
                  {a.accepted_at && <p className="text-xs text-muted-foreground">Accepted {fmtDate(a.accepted_at)}</p>}
                </div>
                {(a.status === "shared" || a.status === "accepted") && <AgreementQR id={a.id} title={title(a.listing_id)} status={a.status} date={a.accepted_at ?? a.shared_at ?? a.created_at} />}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function PaymentsTab({ d }: { d: D }) {
  const act = useAction();
  const payable = d.bookings.filter((b) => b.status === "approved" || b.status === "completed");
  const gross = d.payments.reduce((s, p) => s + Number(p.amount), 0);
  const fee = d.payments.reduce((s, p) => s + Number(p.commission_amount), 0);
  const title = (bid: string) => { const b = d.bookings.find((x) => x.id === bid); return d.listings.find((l) => l.id === b?.listing_id)?.title ?? "Rental"; };
  return (
    <>
      <StatGrid>
        <StatCard icon={Banknote} label="Gross received" value={formatETB(gross)} />
        <StatCard icon={Banknote} label="Platform commission" value={formatETB(fee)} tone="warning" />
        <StatCard icon={Banknote} label="Net earnings" value={formatETB(gross - fee)} tone="primary" />
        <StatCard icon={CalendarCheck} label="Active rentals" value={d.bookings.filter((b) => b.status === "approved").length} />
      </StatGrid>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Record a payment">
          {payable.length === 0 ? <Empty text="Accept a rental request to record payments." /> : (
            <form className="space-y-3" onSubmit={(e) => {
              e.preventDefault(); const f = new FormData(e.currentTarget); const form = e.currentTarget;
              void act(() => supabase.from("payments").insert({
                booking_id: String(f.get("booking")), amount: Number(f.get("amount")), method: String(f.get("method")), reference: String(f.get("reference") ?? "").slice(0, 100),
                owner_id: "", renter_id: "",
              } as never), "Payment recorded").then((ok) => ok && form.reset());
            }}>
              <select name="booking" required className={input}>{payable.map((b) => <option key={b.id} value={b.id}>{title(b.id)} — {b.renter_name}</option>)}</select>
              <input name="amount" type="number" min={1} required placeholder="Amount (ETB)" className={input} />
              <select name="method" className={input}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="telebirr">telebirr</option><option value="other">Other</option></select>
              <input name="reference" placeholder="Reference (optional)" className={input} />
              <button className={btnAccent + " h-9 w-full justify-center"}>Record payment</button>
            </form>
          )}
        </Panel>
        <Panel title="Payment history">
          {d.payments.length === 0 ? <Empty text="No payments recorded yet." /> : (
            <Table head={["Date", "Rental", "Amount", "Method", "Net"]}>
              {d.payments.map((p) => (
                <tr key={p.id}><td className={td}>{fmtDate(p.created_at)}</td><td className={td}>{title(p.booking_id)}</td><td className={td + " font-medium"}>{formatETB(p.amount)}</td><td className={td + " capitalize"}>{p.method.replace("_", " ")}</td><td className={td}>{formatETB(Number(p.amount) - Number(p.commission_amount))}</td></tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}

function ReviewsTab({ d }: { d: D }) {
  const title = (id: string) => d.listings.find((l) => l.id === id)?.title ?? "Listing";
  return (
    <Panel title={`${d.reviews.length} reviews`}>
      {d.reviews.length === 0 ? <Empty text="No reviews yet. Renters can review after a completed rental." /> : (
        <ul className="-my-2 divide-y divide-border">
          {d.reviews.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-center gap-2"><span className="text-accent">{"★".repeat(r.rating)}<span className="text-border">{"★".repeat(5 - r.rating)}</span></span><span className="text-sm font-medium">{r.reviewer_name}</span><span className="text-xs text-muted-foreground">· {title(r.listing_id)} · {ago(r.created_at)}</span></div>
              {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
