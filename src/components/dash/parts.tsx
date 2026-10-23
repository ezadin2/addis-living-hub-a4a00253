import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { Check, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint, tone = "accent" }: {
  icon?: LucideIcon; label: string; value: ReactNode; hint?: string; tone?: "accent" | "warning" | "primary" | "destructive";
}) {
  const tones = {
    accent: "bg-accent",
    warning: "bg-warning",
    primary: "bg-primary",
    destructive: "bg-destructive",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", tones[tone])} />{label}
      </p>
      <p className="mt-3 truncate font-display text-xl font-bold sm:text-2xl tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{children}</div>;
}

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="whitespace-nowrap text-base font-semibold">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Empty({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  approved: "bg-accent-soft text-accent", active: "bg-accent-soft text-accent", verified: "bg-accent-soft text-accent",
  accepted: "bg-accent-soft text-accent", completed: "bg-secondary text-primary", resolved: "bg-accent-soft text-accent",
  pending: "bg-warning-soft text-foreground", shared: "bg-warning-soft text-foreground", open: "bg-warning-soft text-foreground",
  reviewing: "bg-warning-soft text-foreground", draft: "bg-muted text-muted-foreground", not_verified: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive", declined: "bg-destructive/10 text-destructive", cancelled: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/10 text-destructive", failed: "bg-destructive/10 text-destructive", dismissed: "bg-muted text-muted-foreground",
  hidden: "bg-destructive/10 text-destructive",
};
export function Status({ s }: { s: string }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", STATUS_TONE[s] ?? "bg-muted text-muted-foreground")}>{s.replace(/_/g, " ")}</span>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="-mx-5 -my-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-5 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
export const td = "px-5 py-3 align-middle";

export const btn = "inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-semibold hover:bg-muted disabled:opacity-50";
export const btnAccent = "inline-flex h-8 items-center gap-1 rounded-md bg-accent px-2.5 text-xs font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50";
export const btnDanger = "inline-flex h-8 items-center gap-1 rounded-md border border-destructive/30 bg-background px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50";
export const input = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const ago = (d: string) => {
  const s = (Date.now() - Date.parse(d)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

/** Runs a mutation, toasts the result, then refreshes every dashboard query. */
export function useAction() {
  const qc = useQueryClient();
  return async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => {
    const { error } = await fn();
    if (error) { toast.error(error.message); return false; }
    toast.success(ok);
    await qc.invalidateQueries();
    return true;
  };
}

/** Last N months as { key: "2026-05", label: "May" } buckets. */
export function monthBuckets(n = 6) {
  const out: { key: string; label: string }[] = [];
  const d = new Date(); d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ key: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`, label: x.toLocaleString("en", { month: "short" }) });
  }
  return out;
}
export function seriesByMonth<T>(rows: T[], date: (r: T) => string, value: (r: T) => number = () => 1, n = 6) {
  return monthBuckets(n).map((b) => ({ month: b.label, value: rows.filter((r) => date(r).startsWith(b.key)).reduce((s, r) => s + value(r), 0) }));
}

const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };

export function TrendChart({ data, color = "var(--chart-1)" }: { data: { month: string; value: number }[]; color?: string }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
          <defs>
            <linearGradient id={`g${color.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" allowDecimals={false} />
          <Tooltip {...tip} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#g${color.replace(/\W/g, "")})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data, color = "var(--chart-2)" }: { data: { month: string; value: number }[]; color?: string }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <Tooltip {...tip} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const shown = data.filter((d) => d.value > 0);
  if (!shown.length) return <Empty text="No data yet" />;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={shown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
              {shown.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
            </Pie>
            <Tooltip {...tip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid flex-1 gap-2 text-sm">
        {shown.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE[i % PIE.length] }} />
            <span className="flex-1">{d.name}</span><span className="font-semibold">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Notification feed shared by every role. */
export function NotificationsPanel({ limit }: { limit?: number }) {
  const act = useAction();
  const { data = [] } = useQuery({
    queryKey: ["notifications", "list", limit],
    queryFn: async () => {
      let q = supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q; if (error) throw error; return data;
    },
  });
  const unread = data.filter((n) => !n.read).map((n) => n.id);
  return (
    <Panel title="Notifications" action={unread.length > 0 && (
      <button className={btn} onClick={() => void act(() => supabase.from("notifications").update({ read: true }).in("id", unread), "Marked as read")}><Check className="h-3.5 w-3.5" />Mark all read</button>
    )}>
      {data.length === 0 ? <Empty text="You're all caught up." /> : (
        <ul className="-my-2 divide-y divide-border">
          {data.map((n) => (
            <li key={n.id} className="flex gap-3 py-3">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-border" : "bg-accent")} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{ago(n.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
