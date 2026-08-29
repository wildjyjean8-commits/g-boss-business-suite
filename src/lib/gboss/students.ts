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

// ---------- Peman elèv (kreye revni nan Kontabilite otomatikman) ----------

export type StudentPaymentRow = Database["public"]["Tables"]["student_payments"]["Row"];

export type StudentPaymentInput = {
  student_id: string;
  label: string;
  amount_due: number;
  amount_paid: number;
  due_date: string | null;
};

export async function fetchStudentPayments(businessId: string): Promise<StudentPaymentRow[]> {
  const { data, error } = await supabase
    .from("student_payments")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createStudentPayment(businessId: string, input: StudentPaymentInput): Promise<void> {
  const status = input.amount_paid >= input.amount_due ? "paye" : input.amount_paid > 0 ? "pasyèl" : "attente";
  const { error } = await supabase.from("student_payments").insert({
    business_id: businessId,
    status,
    paid_at: input.amount_paid > 0 ? new Date().toISOString() : null,
    ...input,
  });
  if (error) throw error;
}

export async function recordStudentPaymentAmount(id: string, amountPaid: number, amountDue: number): Promise<void> {
  const status = amountPaid >= amountDue ? "paye" : amountPaid > 0 ? "pasyèl" : "attente";
  const { error } = await supabase
    .from("student_payments")
    .update({ amount_paid: amountPaid, status, paid_at: amountPaid > 0 ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}
