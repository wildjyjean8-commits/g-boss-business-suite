import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DisciplineRow = Database["public"]["Tables"]["discipline_records"]["Row"];
export type DisciplineCategory = "avètisman" | "sanksyon" | "ekspilsyon" | "lòt";
export type DisciplineInput = {
  student_id: string;
  occurred_on: string;
  category: DisciplineCategory;
  description: string;
  action_taken: string | null;
};

export const DISCIPLINE_CATEGORIES: { id: DisciplineCategory; label: string }[] = [
  { id: "avètisman", label: "Avètisman" },
  { id: "sanksyon", label: "Sanksyon" },
  { id: "ekspilsyon", label: "Ekspilsyon" },
  { id: "lòt", label: "Lòt" },
];

export async function fetchDisciplineRecords(businessId: string): Promise<DisciplineRow[]> {
  const { data, error } = await supabase
    .from("discipline_records")
    .select("*")
    .eq("business_id", businessId)
    .order("occurred_on", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDisciplineRecord(businessId: string, input: DisciplineInput): Promise<void> {
  const { error } = await supabase.from("discipline_records").insert({ business_id: businessId, ...input });
  if (error) throw error;
}

export async function deleteDisciplineRecord(id: string): Promise<void> {
  const { error } = await supabase.from("discipline_records").delete().eq("id", id);
  if (error) throw error;
}
