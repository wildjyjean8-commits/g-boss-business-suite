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

// ---------- Ajoute yon 2yèm biznis (Biznis oswa Institisyon) ----------

export type AccountType = "biznis" | "institisyon";

export type NewBusinessInput = {
  accountType: AccountType;
  name: string;
  sector: string;
  plan: PlanId;
};

export async function createSecondBusiness(input: NewBusinessInput): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("Session ekspire — rekonekte epi eseye ankò.");

  const trialEndsAt = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      name: input.name.trim(),
      sector: input.accountType === "institisyon" ? "Éducation" : input.sector,
      plan: input.plan,
      pos_enabled: input.accountType === "biznis",
      stock_enabled: input.accountType === "biznis",
      school_addon: input.accountType === "institisyon",
      status: "essai",
      trial_ends_at: trialEndsAt,
      email: user.email ?? "",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
