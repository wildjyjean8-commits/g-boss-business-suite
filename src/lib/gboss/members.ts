import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MemberRow = Database["public"]["Tables"]["business_members"]["Row"];
export type PerformanceRow = Database["public"]["Views"]["v_employee_performance"]["Row"];

export type MemberInput = {
  name: string;
  role: string;
  department: string | null;
  phone: string | null;
};

export async function fetchMembers(businessId: string): Promise<MemberRow[]> {
  const { data, error } = await supabase
    .from("business_members")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchPerformance(businessId: string): Promise<PerformanceRow[]> {
  const { data, error } = await supabase
    .from("v_employee_performance")
    .select("*")
    .eq("business_id", businessId);

  if (error) throw error;
  return data ?? [];
}

export async function createMember(businessId: string, input: MemberInput): Promise<void> {
  const { error } = await supabase.from("business_members").insert({
    business_id: businessId,
    ...input,
  });
  if (error) throw error;
}

export async function updateMember(id: string, input: MemberInput): Promise<void> {
  const { error } = await supabase.from("business_members").update(input).eq("id", id);
  if (error) throw error;
}

export async function setMemberActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("business_members").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function setMemberPresent(id: string, present: boolean): Promise<void> {
  const { error } = await supabase.from("business_members").update({ present }).eq("id", id);
  if (error) throw error;
}
