import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { BUSINESSES, getBusiness, type Business } from "@/lib/gboss/data";

type Ctx = {
  businesses: Business[];
  biz: Business;
  bizId: string;
  setBizId: (id: string) => void;
};

const BizContext = createContext<Ctx | null>(null);

export function BizProvider({ children }: { children: ReactNode }) {
  const [bizId, setBizId] = useState(BUSINESSES[0]!.id);
  const value = useMemo<Ctx>(
    () => ({ businesses: BUSINESSES, biz: getBusiness(bizId), bizId, setBizId }),
    [bizId],
  );
  return <BizContext.Provider value={value}>{children}</BizContext.Provider>;
}

export function useBiz() {
  const ctx = useContext(BizContext);
  if (!ctx) throw new Error("useBiz must be used inside BizProvider");
  return ctx;
}
