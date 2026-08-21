import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BUSINESSES, type Business } from "@/lib/gboss/data";
import { fetchOwnedBusinesses } from "@/lib/gboss/real-business";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  businesses: Business[];
  biz: Business;
  bizId: string;
  setBizId: (id: string) => void;
};

const BizContext = createContext<Ctx | null>(null);

export function BizProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [bizId, setBizId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      const owned = userId ? await fetchOwnedBusinesses(userId) : [];
      // Repli sou done demo si pa gen okenn biznis reyèl jwenn (pa ta dwe rive
      // nòmalman, /app deja egzije yon sesyon valid + enskripsyon kreye 1 biznis).
      const list = owned.length > 0 ? owned : BUSINESSES;

      if (!active) return;
      setBusinesses(list);
      setBizId(list[0]!.id);
    })();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<Ctx | null>(() => {
    if (!businesses || !bizId) return null;
    return {
      businesses,
      biz: businesses.find((b) => b.id === bizId) ?? businesses[0]!,
      bizId,
      setBizId,
    };
  }, [businesses, bizId]);

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FE] text-sm text-muted-foreground">
        Chajman biznis la...
      </div>
    );
  }

  return <BizContext.Provider value={value}>{children}</BizContext.Provider>;
}

export function useBiz() {
  const ctx = useContext(BizContext);
  if (!ctx) throw new Error("useBiz must be used inside BizProvider");
  return ctx;
}
