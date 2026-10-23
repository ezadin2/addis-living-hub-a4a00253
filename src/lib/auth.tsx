import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "owner" | "renter";
interface AuthState {
  session: Session | null;
  userId: string | null;
  email: string | null;
  name: string;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>({
  session: null, userId: null, email: null, name: "", role: null, loading: true, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (s: Session | null) => {
      setSession(s);
      if (!s) { setRole(null); setName(""); setLoading(false); return; }
      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", s.user.id),
        supabase.from("profiles").select("full_name").eq("id", s.user.id).maybeSingle(),
      ]);
      const rs = (roles ?? []).map((r) => r.role as Role);
      setRole(rs.includes("admin") ? "admin" : rs.includes("owner") ? "owner" : rs.length ? "renter" : null);
      setName(prof?.full_name ?? "");
      setLoading(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        setTimeout(() => void load(s), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider value={{ session, userId: session?.user.id ?? null, email: session?.user.email ?? null, name, role, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
