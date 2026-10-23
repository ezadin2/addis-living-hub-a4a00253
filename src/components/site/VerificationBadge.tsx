import { CircleCheckBig, CircleDashed, CircleHelp, CircleX } from "lucide-react";
import type { VerificationStatus } from "@/lib/listings";
import { cn } from "@/lib/utils";

const MAP: Record<VerificationStatus, { label: string; icon: typeof CircleCheckBig; cls: string }> = {
  verified: { label: "ID verified", icon: CircleCheckBig, cls: "bg-accent-soft text-accent" },
  pending: { label: "Verification pending", icon: CircleDashed, cls: "bg-warning-soft text-foreground" },
  not_verified: { label: "Not verified", icon: CircleHelp, cls: "bg-muted text-muted-foreground" },
  failed: { label: "Verification failed", icon: CircleX, cls: "bg-destructive/10 text-destructive" },
};

export function VerificationBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  const m = MAP[status];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", m.cls, className)}>
      <Icon className="h-3.5 w-3.5" /> {m.label}
    </span>
  );
}
