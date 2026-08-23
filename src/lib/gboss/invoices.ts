import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceStatus = "paye" | "attente" | "expire";

export type InvoiceInput = {
  client: string;
  amount: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
};

export async function fetchInvoices(businessId: string): Promise<InvoiceRow[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("business_id", businessId)
    .order("issue_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

function generateReference(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FA-${stamp}-${rand}`;
}

export async function createInvoice(businessId: string, input: InvoiceInput): Promise<void> {
  const { error } = await supabase.from("invoices").insert({
    business_id: businessId,
    reference: generateReference(),
    ...input,
  });
  if (error) throw error;
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
}

export function invoiceMetrics(invoices: InvoiceRow[]) {
  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "paye").reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter((i) => i.status === "attente").reduce((s, i) => s + i.amount, 0);
  const expired = invoices.filter((i) => i.status === "expire").reduce((s, i) => s + i.amount, 0);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = invoices
    .filter((i) => i.issue_date.startsWith(monthKey))
    .reduce((s, i) => s + i.amount, 0);
  return { total, paid, pending, expired, month };
}
