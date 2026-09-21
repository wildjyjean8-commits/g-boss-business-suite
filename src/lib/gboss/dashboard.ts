import { supabase } from "@/integrations/supabase/client";

export type WeekPoint = { day: string; revenue: number; expense: number; orders: number };

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]; // index = Date.getDay()

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Kalkile revni/depans/kòmand pou 7 dènye jou yo, dirèkteman soti nan
 * `receipts` (menm sous done Kontabilite a itilize) ak `sales` (kòmand
 * Kès). Sa asire Dashboard ak Rapò toujou matche ak Kontabilite.
 */
export async function fetchWeekChart(businessId: string): Promise<WeekPoint[]> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  const startKey = toDateKey(start);

  const [{ data: receipts, error: rErr }, { data: sales, error: sErr }] = await Promise.all([
    supabase
      .from("receipts")
      .select("kind, amount, receipt_date")
      .eq("business_id", businessId)
      .gte("receipt_date", startKey),
    supabase
      .from("sales")
      .select("occurred_at")
      .eq("business_id", businessId)
      .gte("occurred_at", start.toISOString()),
  ]);

  if (rErr) throw rErr;
  if (sErr) throw sErr;

  const points: WeekPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toDateKey(d);
    const label = DAY_LABELS[d.getDay()]!;

    const revenue = (receipts ?? [])
      .filter((r) => r.kind === "vant" && r.receipt_date === key)
      .reduce((sum, r) => sum + r.amount, 0);
    const expense = (receipts ?? [])
      .filter((r) => r.kind === "depans" && r.receipt_date === key)
      .reduce((sum, r) => sum + r.amount, 0);
    const orders = (sales ?? []).filter((s) => s.occurred_at.slice(0, 10) === key).length;

    points.push({ day: label, revenue, expense, orders });
  }

  return points;
}
