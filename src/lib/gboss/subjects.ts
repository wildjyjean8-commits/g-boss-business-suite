import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

export async function fetchSubjects(businessId: string): Promise<SubjectRow[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createSubject(businessId: string, name: string): Promise<SubjectRow> {
  const { data, error } = await supabase
    .from("subjects")
    .insert({ business_id: businessId, name: name.trim() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw error;
}
