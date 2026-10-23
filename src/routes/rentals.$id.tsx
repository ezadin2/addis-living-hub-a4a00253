import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bath, BedDouble, Calendar, Check, Flag, Heart, MapPin, Ruler, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { VerificationBadge } from "@/components/site/VerificationBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { bookingQuote, fallbackImage, formatETB, listingImages, unitLabel } from "@/lib/listings";
import { listingQuery } from "@/lib/queries";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/rentals/$id")({
  loader: async ({ params, context }) => {
    const l = await context.queryClient.ensureQueryData(listingQuery(params.id));
    if (!l) throw notFound();
    return l;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — ${loaderData.neighborhood} | FaydaRent` },
          { name: "description", content: `${formatETB(loaderData.price)}/${unitLabel(loaderData.price_unit)} · ${loaderData.neighborhood}, ${loaderData.city}. ${loaderData.description.slice(0, 110)}` },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: `${formatETB(loaderData.price)}/${unitLabel(loaderData.price_unit)} in ${loaderData.neighborhood}` },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Listing unavailable — FaydaRent" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <PageShell>
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">This listing is no longer available</h1>
        <Button asChild variant="accent" className="mt-6"><Link to="/rentals">Browse rentals</Link></Button>
      </div>
    </PageShell>
  ),
  component: Detail,
});

const field = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function Detail() {
  const l = Route.useLoaderData();
  const fav = useFavorites();
  const [img, setImg] = useState(0);
  const images = listingImages(l);
  const onImgError = (i: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const fb = fallbackImage(l.kind, i);
    if (e.currentTarget.src !== new URL(fb, window.location.href).href) e.currentTarget.src = fb;
  };
  return (
    <PageShell>
      <div className="container-page py-8">
        <Link to="/rentals" className="text-sm text-muted-foreground hover:text-foreground">← Back to results</Link>
        <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
          <img key={images[img]} src={images[img] ?? images[0]} onError={onImgError(img)} alt={l.title} className="aspect-[16/10] w-full rounded-xl object-cover" />
          <div className="grid grid-cols-4 gap-3 lg:grid-cols-2">
            {images.map((s, i) => (
              <button key={i} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`} className={`overflow-hidden rounded-lg border-2 ${i === img ? "border-accent" : "border-transparent"}`}>
                <img src={s} onError={onImgError(i)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0">
            {l.premium && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase text-accent">Featured</span>}
            <h1 className="mt-3 text-3xl font-bold">{l.title}</h1>
            <p className="mt-2 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{l.neighborhood}, {l.city}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [BedDouble, `${l.bedrooms} bedrooms`], [Bath, `${l.bathrooms} bathrooms`],
                [Ruler, l.size_sqm ? `${l.size_sqm} m²` : "Size n/a"], [Calendar, `Min ${l.min_term} month${l.min_term > 1 ? "s" : ""}`],
              ].map(([I, t]) => { const Icon = I as typeof Bath; return (
                <div key={t as string} className="rounded-lg border border-border bg-card p-3 text-sm"><Icon className="h-4 w-4 text-accent" /><p className="mt-2 font-medium">{t as string}</p></div>
              ); })}
            </div>
            <h2 className="mt-10 text-xl font-bold">About this property</h2>
            <p className="mt-3 text-muted-foreground">{l.description}</p>
            <h2 className="mt-10 text-xl font-bold">Amenities</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {l.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-accent" />{a}</li>)}
            </ul>
            <h2 className="mt-10 text-xl font-bold">Rental terms</h2>
            <dl className="mt-3 divide-y divide-border rounded-xl border border-border bg-card text-sm">
              {[[l.price_unit === "day" ? "Daily price" : "Monthly rent", formatETB(l.price)], ["Deposit", l.deposit ?? "Ask owner"], ["Furnishing", l.furnishing ?? "—"], ["Minimum duration", `${l.min_term} ${unitLabel(l.price_unit)}${l.min_term > 1 ? "s" : ""}`], ["Listed", new Date(l.created_at).toLocaleDateString()]].map(([k, v]) => (
                <div key={k} className="flex justify-between p-3"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>
              ))}
            </dl>
            <Reviews id={l.id} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <p className="font-display text-2xl font-bold">{formatETB(l.price)}<span className="text-sm font-medium text-muted-foreground"> /{unitLabel(l.price_unit)}</span></p>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{l.owner_name.slice(0, 1)}</div>
                <div><p className="font-semibold">{l.owner_name}</p><p className="text-xs text-muted-foreground">{"Owner"}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <VerificationBadge status={(l.owner_verified ? "verified" : "not_verified")} />
                {(l.status === "approved") && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold"><ShieldCheck className="h-3.5 w-3.5" />Listing reviewed</span>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">ID verification confirms identity, not property ownership. Contact details are shared only after you send a request.</p>
              <div className="mt-4 grid gap-2">
                <RequestDialog kind="rental" l={l} />
                <RequestDialog kind="viewing" l={l} />
                <Button variant="outline" onClick={() => void fav.toggle(l.id)}><Heart className={fav.has(l.id) ? "fill-accent text-accent" : ""} />{fav.has(l.id) ? "Saved" : "Save"}</Button>
              </div>
            </div>
            <ReportDialog l={l} />
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

type L = ReturnType<typeof Route.useLoaderData>;

function SignInPrompt({ what }: { what: string }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">Sign in with a verified account to {what}. Every request is linked to a real identity.</p>
      <Button asChild variant="accent" className="w-full"><Link to="/signin">Sign in or create an account</Link></Button>
    </div>
  );
}

function RequestDialog({ kind, l }: { kind: "rental" | "viewing"; l: L }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { userId, role } = useAuth();
  const navigate = useNavigate();
  const isView = kind === "viewing";
  const daily = l.price_unit === "day";
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [months, setMonths] = useState(l.min_term);
  const quote = bookingQuote(l, start, end || start, months);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant={isView ? "outline" : "accent"}>{isView ? "Request a viewing" : daily ? "Request to rent" : "Request to rent"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{isView ? "Request a viewing" : `Rent ${l.title}`}</DialogTitle></DialogHeader>
        {!userId ? <SignInPrompt what="send a request" /> : l.owner_id === userId ? <p className="text-sm text-muted-foreground">This is your own listing.</p> : role === "admin" ? <p className="text-sm text-muted-foreground">Admin accounts can't book rentals.</p> : (
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const phone = String(fd.get("phone")).replace(/\s/g, "");
          if (!/^(\+251|0)?9\d{8}$/.test(phone)) { toast.error("Enter a valid Ethiopian phone number, e.g. 09XX XXX XXX"); return; }
          let s = start, en = end || start;
          if (!isView && !daily) {
            const d = new Date(start); d.setMonth(d.getMonth() + Math.max(months, l.min_term)); d.setDate(d.getDate() - 1);
            en = d.toISOString().slice(0, 10);
          }
          if (isView) en = s;
          if (!s || en < s) { toast.error("Choose valid dates"); return; }
          setBusy(true);
          const { error } = await supabase.from("bookings").insert({
            listing_id: l.id, renter_id: userId, owner_id: l.owner_id, kind, start_date: s, end_date: en,
            units: isView ? 0 : daily ? quote.units : Math.max(months, l.min_term), phone, renter_name: String(fd.get("name") ?? ""),
            message: String(fd.get("msg") ?? "").slice(0, 500),
          });
          setBusy(false);
          if (error) { toast.error(error.message); return; }
          setOpen(false);
          toast.success("Request sent to the owner", { description: "Track it in your dashboard." });
          void navigate({ to: "/renter", search: { tab: "requests" } });
        }}>
          <label className="block text-sm font-medium">Your name<input name="name" required className={field} /></label>
          <label className="block text-sm font-medium">Phone<input name="phone" required placeholder="09XX XXX XXX" className={field} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">{isView ? "Preferred date" : "Start date"}<input type="date" min={today} required value={start} onChange={(e) => setStart(e.target.value)} className={field} /></label>
            {!isView && (daily
              ? <label className="block text-sm font-medium">End date<input type="date" min={start || today} required value={end} onChange={(e) => setEnd(e.target.value)} className={field} /></label>
              : <label className="block text-sm font-medium">Months<input type="number" min={l.min_term} value={months} onChange={(e) => setMonths(Number(e.target.value))} className={field} /></label>)}
          </div>
          <label className="block text-sm font-medium">Message<textarea name="msg" rows={3} className="mt-1 w-full rounded-md border border-input bg-background p-3 text-sm" defaultValue={isView ? "" : "Hello, is this still available for these dates?"} /></label>
          {!isView && quote.total > 0 && <p className="rounded-md bg-muted p-3 text-sm">Estimated total: <span className="font-semibold">{formatETB(quote.total)}</span> for {quote.units} {unitLabel(l.price_unit)}{quote.units > 1 ? "s" : ""}</p>}
          <Button type="submit" variant="accent" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send request"}</Button>
        </form>)}
      </DialogContent>
    </Dialog>
  );
}

function ReportDialog({ l }: { l: L }) {
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><button className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-destructive"><Flag className="h-4 w-4" />Report suspicious listing</button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Report this listing</DialogTitle></DialogHeader>
        {!userId ? <SignInPrompt what="report a listing" /> : (
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault(); const f = new FormData(e.currentTarget);
          const { error } = await supabase.from("reports").insert({ reporter_id: userId, kind: "listing", listing_id: l.id, reason: String(f.get("reason")), details: String(f.get("details") ?? "").slice(0, 2000) });
          if (error) { toast.error(error.message); return; }
          setOpen(false); toast.success("Report sent to our moderation team");
        }}>
          <select name="reason" required className={field}><option value="">Choose a reason</option><option>Asked for payment before viewing</option><option>Fake or misleading photos</option><option>Owner identity doubts</option><option>Already rented</option></select>
          <textarea name="details" rows={3} placeholder="Details (optional)" className="w-full rounded-md border border-input bg-background p-3 text-sm" />
          <Button type="submit" variant="destructive" className="w-full">Submit report</Button>
        </form>)}
      </DialogContent>
    </Dialog>
  );
}

function Reviews({ id }: { id: string }) {
  const { data = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => (await supabase.from("reviews").select("*").eq("listing_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const visible = data.filter((r) => (r as { hidden?: boolean }).hidden !== true);
  const avg = visible.length ? (visible.reduce((s, r) => s + r.rating, 0) / visible.length).toFixed(1) : null;
  return (
    <>
      <h2 className="mt-10 flex items-center gap-2 text-xl font-bold"><Star className="h-5 w-5 text-accent" />{avg ? `${avg} · ${visible.length} review${visible.length > 1 ? "s" : ""}` : "Reviews"}</h2>
      {visible.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No reviews yet. Renters can review after a completed rental.</p> : (
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
          {visible.map((r) => (
            <li key={r.id} className="p-4">
              <p className="text-sm"><span className="text-accent">{"★".repeat(r.rating)}</span><span className="text-border">{"★".repeat(5 - r.rating)}</span> <span className="font-medium">{r.reviewer_name}</span></p>
              {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
