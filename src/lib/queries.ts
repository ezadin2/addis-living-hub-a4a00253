import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Listing } from "./listings";

export const publicListingsQuery = queryOptions({
  queryKey: ["listings", "public"],
  queryFn: async (): Promise<Listing[]> => {
    const { data, error } = await supabase.from("listings").select("*").eq("status", "approved").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listing", id],
    queryFn: async (): Promise<Listing | null> => {
      // Old/static links (e.g. /rentals/p1) aren't UUIDs; the DB would reject them with an error.
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
