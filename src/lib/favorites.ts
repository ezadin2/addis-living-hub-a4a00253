import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const KEY = "faydarent:favorites";
const EVT = "faydarent:favorites";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/** Saved listings: stored in the account when signed in, in this browser otherwise. */
export function useFavorites() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [local, setLocal] = useState<string[]>([]);
  useEffect(() => {
    setLocal(read());
    const sync = () => setLocal(read());
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  const remote = useQuery({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => (await supabase.from("favorites").select("listing_id").eq("user_id", userId!)).data?.map((f) => f.listing_id) ?? [],
  });
  const ids = userId ? (remote.data ?? []) : local;
  const toggle = useCallback(async (id: string) => {
    if (!userId) {
      const cur = read();
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVT));
      return;
    }
    const has = ids.includes(id);
    const { error } = has
      ? await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", id)
      : await supabase.from("favorites").insert({ user_id: userId, listing_id: id });
    if (error) toast.error(error.message);
    else toast.success(has ? "Removed from saved" : "Saved to your account");
    void qc.invalidateQueries({ queryKey: ["favorites"] });
    void qc.invalidateQueries({ queryKey: ["renter"] });
  }, [userId, ids, qc]);
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
