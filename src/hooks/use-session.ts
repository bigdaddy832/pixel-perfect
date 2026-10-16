import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { setUser(session?.user ?? null); setReady(true); });
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export function useUsername(userId?: string) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) { setName(null); return; }
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle().then(({ data }) => setName(data?.username ?? null));
  }, [userId]);
  return name;
}
