import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// ---------- Nòt (grades) ----------

export type GradeRow = Database["public"]["Tables"]["student_grades"]["Row"];

export type GradeInput = {
  student_id: string;
  subject: string;
  period: string;
  grade: number;
  max_grade: number;
  comment: string | null;
};

export async function fetchGrades(businessId: string): Promise<GradeRow[]> {
  const { data, error } = await supabase
    .from("student_grades")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGrade(businessId: string, input: GradeInput): Promise<void> {
  const { error } = await supabase.from("student_grades").insert({ business_id: businessId, ...input });
  if (error) throw error;
}

export async function deleteGrade(id: string): Promise<void> {
  const { error } = await supabase.from("student_grades").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Prezans (attendance) ----------

export type AttendanceRow = Database["public"]["Tables"]["student_attendance"]["Row"];

export type AttendanceMark = {
  student_id: string;
  present: boolean;
  note: string | null;
};

export async function fetchAttendance(businessId: string): Promise<AttendanceRow[]> {
  const { data, error } = await supabase
    .from("student_attendance")
    .select("*")
    .eq("business_id", businessId)
    .order("attended_on", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAttendanceForDate(businessId: string, date: string): Promise<AttendanceRow[]> {
  const { data, error } = await supabase
    .from("student_attendance")
    .select("*")
    .eq("business_id", businessId)
    .eq("attended_on", date);
  if (error) throw error;
  return data ?? [];
}

// Anrejistre prezans plizyè elèv pou yon menm jou nan yon sèl apèl (upsert)
export async function saveAttendanceBatch(businessId: string, date: string, marks: AttendanceMark[]): Promise<void> {
  if (marks.length === 0) return;
  const rows = marks.map((m) => ({
    business_id: businessId,
    attended_on: date,
    student_id: m.student_id,
    present: m.present,
    note: m.note,
  }));
  const { error } = await supabase
    .from("student_attendance")
    .upsert(rows, { onConflict: "student_id,attended_on" });
  if (error) throw error;
}
