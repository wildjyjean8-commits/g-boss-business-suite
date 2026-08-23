import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SaleRow = Database["public"]["Tables"]["sales"]["Row"];

export type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
};

function weekStartIso(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export async function fetchWeekSales(businessId: string): Promise<SaleRow[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .gte("occurred_at", weekStartIso())
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type TopProduct = { productId: string; qty: number; revenue: number };

export async function fetchTopProducts(businessId: string, limit = 5): Promise<TopProduct[]> {
  const { data, error } = await supabase
    .from("sale_items")
    .select("product_id, quantity, unit_price, sales!inner(business_id)")
    .eq("sales.business_id", businessId);

  if (error) throw error;

  const byProduct = new Map<string, TopProduct>();
  for (const row of data ?? []) {
    if (!row.product_id) continue;
    const current = byProduct.get(row.product_id) ?? { productId: row.product_id, qty: 0, revenue: 0 };
    current.qty += row.quantity;
    current.revenue += row.quantity * row.unit_price;
    byProduct.set(row.product_id, current);
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

export async function completeSale(
  businessId: string,
  lines: CartLine[],
  taxRate: number,
  paymentMethod: string,
): Promise<void> {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      business_id: businessId,
      payment_method: paymentMethod,
      subtotal,
      tax_amount: taxAmount,
      total,
    })
    .select("id")
    .single();

  if (saleError) throw saleError;

  const { error: itemsError } = await supabase.from("sale_items").insert(
    lines.map((l) => ({
      sale_id: sale.id,
      product_id: l.productId,
      quantity: l.qty,
      unit_price: l.unitPrice,
    })),
  );

  if (itemsError) throw itemsError;
}
