import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Business } from "@/lib/gboss/data";
import { ensureOwnedBusiness } from "@/lib/gboss/real-business";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  businesses: Business[];
  biz: Business;
  bizId: string;
  setBizId: (id: string) => void;
  refreshBusinesses: () => Promise<void>;
};

const BizContext = createContext<Ctx | null>(null);

export function BizProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [bizId, setBizId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function load(active: () => boolean) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    const owned = user ? await ensureOwnedBusiness(user.id, user) : [];

    if (!active()) return;

    if (owned.length === 0) {
      // Pa gen okenn done fiktif nan repli — si vrèman pa gen biznis mare ak
      // kont lan (menm apre tantativ rekiperasyon otomatik), voye itilizatè a
      // fini enskripsyon an olye montre chif envante.
      setFailed(true);
      return;
    }

    setBusinesses(owned);
    setBizId((prev) => (prev && owned.some((b) => b.id === prev) ? prev : owned[0]!.id));
  }

  useEffect(() => {
    let active = true;
    load(() => active);
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
      refreshBusinesses: () => load(() => true),
    };
  }, [businesses, bizId]);

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8F9FE] px-6 text-center">
        <p className="font-display text-lg font-semibold text-[#0A0A14]">
          Nou pa jwenn biznis mare ak kont ou a
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Fòk ou fini kreye biznis ou a anvan ou ka antre nan espas travay la.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/enskripsyon" })}
          className="mt-2 rounded-md bg-[#3721FF] px-4 py-2 text-sm font-semibold text-white"
        >
          Fini kreye biznis mwen an
        </button>
      </div>
    );
  }

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
