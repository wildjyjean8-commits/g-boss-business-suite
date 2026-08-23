import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AccountRow = Database["public"]["Tables"]["ledger_accounts"]["Row"];
export type AccountType = "revenu" | "depans";

export type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
export type ReceiptKind = "vant" | "depans";

export type AccountInput = { name: string; type: AccountType };

export type ReceiptInput = {
  kind: ReceiptKind;
  party: string | null;
  account_id: string | null;
  amount: number;
  receipt_date: string;
  file_url: string | null;
};

// ---------- Chart of Accounts ----------

export async function fetchAccounts(businessId: string): Promise<AccountRow[]> {
  const { data, error } = await supabase
    .from("ledger_accounts")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAccount(businessId: string, input: AccountInput): Promise<AccountRow> {
  const { data, error } = await supabase
    .from("ledger_accounts")
    .insert({ business_id: businessId, ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from("ledger_accounts").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Resi (Receipts) ----------

function generateReceiptReference(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RC-${stamp}-${rand}`;
}

export async function fetchReceipts(businessId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("business_id", businessId)
    .order("receipt_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createReceipt(businessId: string, input: ReceiptInput): Promise<void> {
  const { error } = await supabase.from("receipts").insert({
    business_id: businessId,
    reference: generateReceiptReference(),
    source: "manuel",
    ...input,
  });
  if (error) throw error;
}

export async function deleteReceipt(id: string): Promise<void> {
  const { error } = await supabase.from("receipts").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadReceiptFile(businessId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${businessId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Rapò finansye ----------

export function financialSummary(receipts: ReceiptRow[]) {
  const revenue = receipts.filter((r) => r.kind === "vant").reduce((s, r) => s + r.amount, 0);
  const expense = receipts.filter((r) => r.kind === "depans").reduce((s, r) => s + r.amount, 0);
  return { revenue, expense, net: revenue - expense };
}

export function monthlySeries(receipts: ReceiptRow[], months = 6) {
  const now = new Date();
  const buckets: { key: string; label: string; revenue: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      revenue: 0,
      expense: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const r of receipts) {
    const key = r.receipt_date.slice(0, 7);
    const bucket = byKey.get(key);
    if (!bucket) continue;
    if (r.kind === "vant") bucket.revenue += r.amount;
    else bucket.expense += r.amount;
  }
  return buckets;
}

export function accountBreakdown(receipts: ReceiptRow[], accounts: AccountRow[]) {
  const byAccount = new Map<string, { name: string; type: AccountType; total: number }>();
  for (const r of receipts) {
    const acc = accounts.find((a) => a.id === r.account_id);
    const name = acc?.name ?? "Sans catégorie";
    const type: AccountType = acc?.type === "revenu" || acc?.type === "depans" ? acc.type : r.kind === "vant" ? "revenu" : "depans";
    const current = byAccount.get(name) ?? { name, type, total: 0 };
    current.total += r.amount;
    byAccount.set(name, current);
  }
  return Array.from(byAccount.values()).sort((a, b) => b.total - a.total);
}
