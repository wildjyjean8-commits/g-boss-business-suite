import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LinkedStudentRow = Database["public"]["Tables"]["students"]["Row"];
export type PortalGradeRow = Database["public"]["Tables"]["student_grades"]["Row"];
export type PortalAttendanceRow = Database["public"]["Tables"]["student_attendance"]["Row"];
export type PortalPaymentRow = Database["public"]["Tables"]["student_payments"]["Row"];

export async function linkGuardianByCode(code: string, role: "paran" | "elèv"): Promise<string> {
  const { data, error } = await supabase.rpc("link_guardian_by_code", { p_code: code, p_role: role });
  if (error) throw error;
  return data as string;
}

// RLS retounen sèlman ranje kote guardian_user_id/student_user_id = auth.uid()
export async function fetchMyLinkedStudents(): Promise<LinkedStudentRow[]> {
  const { data, error } = await supabase.from("students").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchStudentGrades(studentId: string): Promise<PortalGradeRow[]> {
  const { data, error } = await supabase
    .from("student_grades")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchStudentAttendance(studentId: string): Promise<PortalAttendanceRow[]> {
  const { data, error } = await supabase
    .from("student_attendance")
    .select("*")
    .eq("student_id", studentId)
    .order("attended_on", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function fetchStudentPayments(studentId: string): Promise<PortalPaymentRow[]> {
  const { data, error } = await supabase
    .from("student_payments")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
