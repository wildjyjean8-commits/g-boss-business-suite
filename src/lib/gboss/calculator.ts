import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CalcMemoRow = Database["public"]["Tables"]["calc_memos"]["Row"];

export async function fetchCalcMemos(businessId: string, limit = 10): Promise<CalcMemoRow[]> {
  const { data, error } = await supabase
    .from("calc_memos")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function saveCalcMemo(
  businessId: string,
  input: { note: string | null; expression: string | null; result: number },
): Promise<void> {
  const { error } = await supabase.from("calc_memos").insert({ business_id: businessId, ...input });
  if (error) throw error;
}

export async function deleteCalcMemo(id: string): Promise<void> {
  const { error } = await supabase.from("calc_memos").delete().eq("id", id);
  if (error) throw error;
}
