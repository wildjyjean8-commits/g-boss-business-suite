import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "./data";

export type BusinessSettingsInput = {
  currency: "HTG" | "USD";
  exchange_rate: number;
  tax_rate: number;
  plan: PlanId;
  hotel_addon: boolean;
  pos_enabled: boolean;
  stock_enabled: boolean;
};

export async function updateBusinessSettings(businessId: string, input: BusinessSettingsInput): Promise<void> {
  const { error } = await supabase.from("businesses").update(input).eq("id", businessId);
  if (error) throw error;
}
