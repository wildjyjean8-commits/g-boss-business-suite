import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];

export type SupplierInput = {
  name: string;
  category: string | null;
  contact: string | null;
  on_gboss: boolean;
};

export async function fetchSuppliers(businessId: string): Promise<SupplierRow[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createSupplier(businessId: string, input: SupplierInput): Promise<void> {
  const { error } = await supabase.from("suppliers").insert({
    business_id: businessId,
    ...input,
  });
  if (error) throw error;
}

export async function setSupplierActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("suppliers").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Acha (kreye depans nan Kontabilite otomatikman) ----------

export type PurchaseRow = Database["public"]["Tables"]["supplier_purchases"]["Row"];

export type PurchaseInput = {
  supplier_id: string;
  description: string | null;
  amount: number;
  purchase_date: string;
};

export async function fetchPurchases(businessId: string): Promise<PurchaseRow[]> {
  const { data, error } = await supabase
    .from("supplier_purchases")
    .select("*")
    .eq("business_id", businessId)
    .order("purchase_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPurchase(businessId: string, input: PurchaseInput): Promise<void> {
  const { error } = await supabase.from("supplier_purchases").insert({
    business_id: businessId,
    ...input,
  });
  if (error) throw error;
}
