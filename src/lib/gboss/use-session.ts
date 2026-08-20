import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SessionState = {
  session: Session | null;
  isSuperAdmin: boolean;
  loading: boolean;
};

/**
 * Expose la session Supabase réelle (pas de démo) et le flag
 * profiles.is_super_admin, pour l'UI côté client (afficher/cacher
 * des liens, bouton déconnexion, etc.). La protection réelle des
 * routes reste dans beforeLoad — ce hook sert seulement à l'affichage.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    isSuperAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    async function loadSession(session: Session | null) {
      if (!session) {
        if (active) setState({ session: null, isSuperAdmin: false, loading: false });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", session.user.id)
        .single();
      if (active) {
        setState({ session, isSuperAdmin: !!profile?.is_super_admin, loading: false });
      }
    }

    supabase.auth.getSession().then(({ data }) => loadSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loadSession(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/login";
}
