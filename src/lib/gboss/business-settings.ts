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

export type BusinessProfileInput = {
  legal_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
};

export async function updateBusinessProfile(businessId: string, input: BusinessProfileInput): Promise<void> {
  const { error } = await supabase.from("businesses").update(input).eq("id", businessId);
  if (error) throw error;
}

export async function uploadBusinessLogo(businessId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${businessId}/logo-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("business-logos")
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("business-logos").getPublicUrl(path);
  const { error: updateError } = await supabase
    .from("businesses")
    .update({ logo_url: data.publicUrl })
    .eq("id", businessId);
  if (updateError) throw updateError;
  return data.publicUrl;
}
