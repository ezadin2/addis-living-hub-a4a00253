import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { AMENITIES, CATEGORIES, NEIGHBORHOODS } from "@/lib/listings";

export const Route = createFileRoute("/list-property")({
  head: () => ({
    meta: [
      { title: "List your property — FaydaRent" },
      { name: "description", content: "Publish your apartment, house or room to renters across Ethiopia in a few guided steps." },
      { property: "og:title", content: "List your property — FaydaRent" },
      { property: "og:description", content: "Reach serious renters with a verified listing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const STEPS = ["Basics", "Details", "Photos", "Terms"];
const f = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function Page() {
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  if (done)
    return (
      <PageShell>
        <div className="container-page max-w-lg py-24 text-center">
          <Check className="mx-auto h-12 w-12 rounded-full bg-accent-soft p-2 text-accent" />
          <h1 className="mt-4 text-2xl font-bold">Draft saved (demo)</h1>
          <p className="mt-2 text-muted-foreground">Publishing and moderation will be enabled once accounts are connected.</p>
          <Button asChild variant="accent" className="mt-6"><Link to="/dashboard">Go to dashboard</Link></Button>
        </div>
      </PageShell>
    );
  return (
    <PageShell>
      <PageHeading eyebrow="For owners" title="List your property" intro="Four short steps. You can save and finish later." />
      <div className="container-page mt-8 max-w-3xl">
        <ol className="flex gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`} />
              <p className={`mt-2 text-xs font-semibold ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{i + 1}. {s}</p>
            </li>
          ))}
        </ol>
        <form
          className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) setStep(step + 1);
            else { toast.success("Listing draft saved"); setDone(true); }
          }}
        >
          <div className={step === 0 ? "space-y-4" : "hidden"}>
            <label className="block text-sm font-medium">Title<input required={step === 0} minLength={8} className={f} placeholder="e.g. Bright 2-bedroom near Bole Atlas" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Category<select required={step === 0} className={f}><option value="">Select</option>{CATEGORIES.map((c) => <option key={c.id}>{c.label}</option>)}</select></label>
              <label className="block text-sm font-medium">Neighborhood / location<input required={step === 0} list="lp-neighborhoods" maxLength={80} placeholder="Pick or type your area" className={f} /><datalist id="lp-neighborhoods">{NEIGHBORHOODS.map((n) => <option key={n} value={n} />)}</datalist></label>
            </div>
          </div>
          <div className={step === 1 ? "space-y-4" : "hidden"}>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium">Bedrooms<input type="number" min={0} required={step === 1} className={f} /></label>
              <label className="block text-sm font-medium">Bathrooms<input type="number" min={1} required={step === 1} className={f} /></label>
              <label className="block text-sm font-medium">Size (m²)<input type="number" min={1} className={f} /></label>
            </div>
            <label className="block text-sm font-medium">Description<textarea rows={4} required={step === 1} minLength={30} className="mt-1 w-full rounded-md border border-input bg-background p-3 text-sm" /></label>
            <fieldset><legend className="text-sm font-medium">Amenities</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{AMENITIES.map((a) => <label key={a} className="flex items-center gap-2 text-sm"><input type="checkbox" />{a}</label>)}</div></fieldset>
          </div>
          <div className={step === 2 ? "space-y-4" : "hidden"}>
            <label className="block text-sm font-medium">Photos (JPG or PNG, up to 5 MB each)
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-2 block text-sm" onChange={(e) => {
                const files = Array.from(e.target.files ?? []).filter((x) => x.size <= 5_000_000);
                setPhotos(files.map((x) => URL.createObjectURL(x)));
              }} />
            </label>
            {photos.length === 0 ? <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No photos yet — listings with 5+ photos get more inquiries.</p> :
              <div className="grid grid-cols-3 gap-3">{photos.map((p) => <img key={p} src={p} alt="Preview" className="aspect-[4/3] rounded-lg object-cover" />)}</div>}
          </div>
          <div className={step === 3 ? "space-y-4" : "hidden"}>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium">Monthly rent (ETB)<input type="number" min={500} required={step === 3} className={f} /></label>
              <label className="block text-sm font-medium">Deposit<input className={f} placeholder="e.g. 2 months" /></label>
              <label className="block text-sm font-medium">Min. months<input type="number" min={1} defaultValue={6} className={f} /></label>
            </div>
            <label className="block text-sm font-medium">Contact phone<input required={step === 3} pattern="^(\+251|0)?9\d{8}$" placeholder="09XXXXXXXX" className={f} /></label>
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            <Button type="submit" variant="accent">{step < 3 ? "Continue" : "Save draft"}</Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
