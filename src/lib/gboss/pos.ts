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

export async function fetchSaleReceiptDetails(saleId: string) {
  const { data: sale, error: saleError } = await supabase.from("sales").select("*").eq("id", saleId).single();
  if (saleError) throw saleError;

  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select("product_id, quantity, unit_price")
    .eq("sale_id", saleId);
  if (itemsError) throw itemsError;

  const productIds = Array.from(new Set((items ?? []).map((i) => i.product_id).filter((id): id is string => !!id)));
  const namesById = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await supabase.from("products").select("id, name").in("id", productIds);
    for (const p of products ?? []) namesById.set(p.id, p.name);
  }

  return {
    sale,
    lines: (items ?? []).map((i) => ({
      name: (i.product_id && namesById.get(i.product_id)) ?? "Produit",
      qty: i.quantity,
      unitPrice: i.unit_price,
    })),
  };
}
export type CompletedSale = {
  saleId: string;
  reference: string | null;
  occurredAt: string;
  subtotal: number;
  taxAmount: number;
  total: number;
};

export async function completeSale(
  businessId: string,
  lines: CartLine[],
  taxRate: number,
  paymentMethod: string,
  clientName?: string | null,
): Promise<CompletedSale> {
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
    .select("id, occurred_at")
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

  // Yon resi kreye otomatikman pa yon trigger SQL lè vant lan antre (etap anwo
  // a). Nou al chèche l pou n gen referans lan, epi nou mete non kliyan an si
  // itilizatè a antre l.
  let reference: string | null = null;
  const { data: receipt } = await supabase
    .from("receipts")
    .select("id, reference")
    .eq("source", "vant")
    .eq("source_id", sale.id)
    .maybeSingle();

  if (receipt) {
    reference = receipt.reference;
    if (clientName && clientName.trim()) {
      await supabase.from("receipts").update({ party: clientName.trim() }).eq("id", receipt.id);
    }
  }

  return { saleId: sale.id, reference, occurredAt: sale.occurred_at, subtotal, taxAmount, total };
}
