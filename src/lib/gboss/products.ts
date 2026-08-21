import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type ProductInput = {
  sku: string;
  name: string;
  category: string | null;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
};

export async function fetchProducts(businessId: string): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createProduct(businessId: string, input: ProductInput): Promise<void> {
  const { error } = await supabase.from("products").insert({
    business_id: businessId,
    ...input,
  });
  if (error) throw error;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export function productStockStatus(p: ProductRow): "ok" | "low" | "crit" {
  if (p.stock <= p.min_stock * 0.35) return "crit";
  if (p.stock < p.min_stock) return "low";
  return "ok";
}

export function productStockMetrics(products: ProductRow[]) {
  const value = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const retail = products.reduce((s, p) => s + p.stock * p.price, 0);
  const low = products.filter((p) => productStockStatus(p) !== "ok");
  const units = products.reduce((s, p) => s + p.stock, 0);
  const categoryNames = Array.from(new Set(products.map((p) => p.category ?? "Sans catégorie")));
  const categories = categoryNames.map((name) => ({
    name,
    count: products.filter((p) => (p.category ?? "Sans catégorie") === name).length,
    value: products
      .filter((p) => (p.category ?? "Sans catégorie") === name)
      .reduce((s, p) => s + p.stock * p.cost, 0),
  }));
  return { value, retail, low, units, categories, total: products.length };
}
