import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StudentRow = Database["public"]["Tables"]["students"]["Row"];
export type StudentStatus = "actif" | "restriksyone";

export type StudentInput = {
  name: string;
  classroom: string | null;
  guardian: string | null;
};

export async function fetchStudents(businessId: string): Promise<StudentRow[]> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createStudent(businessId: string, input: StudentInput): Promise<void> {
  const { error } = await supabase.from("students").insert({
    business_id: businessId,
    status: "actif",
    ...input,
  });
  if (error) throw error;
}

export async function setStudentStatus(id: string, status: StudentStatus): Promise<void> {
  const { error } = await supabase.from("students").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}
