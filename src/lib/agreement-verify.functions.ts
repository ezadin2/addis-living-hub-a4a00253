import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface AgreementCheck {
  id: string; ref: string; status: string; listing: string; city: string;
  createdAt: string; sharedAt: string | null; acceptedAt: string | null;
}

/** Public lookup for a QR scan: returns only non-personal agreement facts. */
export const verifyAgreement = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<AgreementCheck | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: a } = await supabaseAdmin.from("agreements")
      .select("id, status, listing_id, created_at, shared_at, accepted_at").eq("id", data.id).maybeSingle();
    if (!a || a.status === "draft") return null;
    const { data: l } = await supabaseAdmin.from("listings").select("title, city").eq("id", a.listing_id).maybeSingle();
    return {
      id: a.id, ref: agreementRef(a.id), status: a.status, listing: l?.title ?? "Listing", city: l?.city ?? "",
      createdAt: a.created_at, sharedAt: a.shared_at, acceptedAt: a.accepted_at,
    };
  });

export function agreementRef(id: string) {
  return "FR-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
