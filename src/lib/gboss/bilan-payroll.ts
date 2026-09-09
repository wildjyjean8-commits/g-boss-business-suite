import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// ---------- Types ----------

export type BalanceSheet = {
  business_id: string;
  kach: number;
  kont_pou_resevwa: number;
  valè_estòk: number;
  pasif_total: number;
  kapital_enjekte: number;
  tirad_total: number;
};

export type EquityRow = Database["public"]["Tables"]["owner_equity_entries"]["Row"];
export type EquityKind = "kapital" | "tirad";
export type EquityInput = { kind: EquityKind; amount: number; entry_date: string; note: string | null };

export type LiabilityRow = Database["public"]["Tables"]["liabilities"]["Row"];
export type LiabilityKind = "prè_bankè" | "founisè" | "lòt";
export type LiabilityInput = {
  kind: LiabilityKind;
  creditor: string;
  amount: number;
  due_date: string | null;
  note: string | null;
};

export type PayrollRunRow = Database["public"]["Tables"]["payroll_runs"]["Row"];
export type PayrollRunItemRow = Database["public"]["Tables"]["payroll_run_items"]["Row"];
export type PayrollRunInput = { period_label: string; period_start: string; period_end: string };

// ---------- Bilan ----------

export async function fetchBalanceSheet(businessId: string): Promise<BalanceSheet | null> {
  const { data, error } = await supabase
    .from("v_balance_sheet")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    business_id: data.business_id ?? businessId,
    kach: data.kach ?? 0,
    kont_pou_resevwa: data.kont_pou_resevwa ?? 0,
    valè_estòk: data.valè_estòk ?? 0,
    pasif_total: data.pasif_total ?? 0,
    kapital_enjekte: data.kapital_enjekte ?? 0,
    tirad_total: data.tirad_total ?? 0,
  };
}

export async function fetchEquityEntries(businessId: string): Promise<EquityRow[]> {
  const { data, error } = await supabase
    .from("owner_equity_entries")
    .select("*")
    .eq("business_id", businessId)
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEquityEntry(businessId: string, input: EquityInput): Promise<void> {
  const { error } = await supabase.from("owner_equity_entries").insert({ business_id: businessId, ...input });
  if (error) throw error;
}

export async function fetchLiabilities(businessId: string): Promise<LiabilityRow[]> {
  const { data, error } = await supabase
    .from("liabilities")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createLiability(businessId: string, input: LiabilityInput): Promise<void> {
  const { error } = await supabase.from("liabilities").insert({ business_id: businessId, ...input });
  if (error) throw error;
}

export async function markLiabilityPaid(id: string): Promise<void> {
  const { error } = await supabase.from("liabilities").update({ status: "peye" }).eq("id", id);
  if (error) throw error;
}

// ---------- Payroll ----------

export async function fetchPayrollRuns(businessId: string): Promise<PayrollRunRow[]> {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPayrollRunItems(runId: string): Promise<PayrollRunItemRow[]> {
  const { data, error } = await supabase
    .from("payroll_run_items")
    .select("*")
    .eq("payroll_run_id", runId)
    .order("member_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPayrollRun(businessId: string, input: PayrollRunInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_payroll_run", {
    p_business_id: businessId,
    p_period_label: input.period_label,
    p_period_start: input.period_start,
    p_period_end: input.period_end,
  });
  if (error) throw error;
  return data as string;
}

export async function processPayrollRun(runId: string): Promise<void> {
  const { error } = await supabase.rpc("process_payroll_run", { p_run_id: runId });
  if (error) throw error;
}
