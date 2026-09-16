import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Business } from "@/lib/gboss/data";
import { ensureOwnedBusiness, fetchMemberBusinesses } from "@/lib/gboss/real-business";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  businesses: Business[];
  biz: Business;
  bizId: string;
  setBizId: (id: string) => void;
  refreshBusinesses: () => Promise<void>;
  myRole: string | null;
  isOwner: boolean;
};

const BizContext = createContext<Ctx | null>(null);

export function BizProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [bizId, setBizId] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [roleByBusiness, setRoleByBusiness] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);

  async function load(active: () => boolean) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) {
      if (active()) setFailed(true);
      return;
    }

    const memberEntries = await fetchMemberBusinesses(user.id);
    const owned = await ensureOwnedBusiness(user.id, user);

    if (!active()) return;

    const merged = [...owned, ...memberEntries.map((e) => e.business).filter((b) => !owned.some((o) => o.id === b.id))];

    if (merged.length === 0) {
      // Pa gen okenn done fiktif nan repli — si vrèman pa gen biznis mare ak
      // kont lan (menm apre tantativ rekiperasyon otomatik), voye itilizatè a
      // fini enskripsyon an olye montre chif envante.
      setFailed(true);
      return;
    }

    const roles: Record<string, string> = {};
    memberEntries.forEach((e) => {
      roles[e.business.id] = e.role;
    });

    setBusinesses(merged);
    setOwnedIds(new Set(owned.map((b) => b.id)));
    setRoleByBusiness(roles);
    setBizId((prev) => (prev && merged.some((b) => b.id === prev) ? prev : merged[0]!.id));
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
      isOwner: ownedIds.has(bizId),
      myRole: ownedIds.has(bizId) ? null : (roleByBusiness[bizId] ?? null),
    };
  }, [businesses, bizId, ownedIds, roleByBusiness]);

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8F9FE] px-6 text-center">
        <p className="font-display text-lg font-semibold text-[#0A0A14]">
          Nou pa jwenn biznis mare ak kont ou a
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Fòk ou fini kreye biznis ou a, oswa antre kòd aksè ekip ou resevwa a.
        </p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/enskripsyon" })}
            className="rounded-md bg-[#3721FF] px-4 py-2 text-sm font-semibold text-white"
          >
            Fini kreye biznis mwen an
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/koneksyon-ekip" })}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold"
          >
            Mwen se yon manm ekip
          </button>
        </div>
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
