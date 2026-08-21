/**
 * Pon ant vrè tab `businesses` Supabase la ak done demo yo.
 *
 * Pou kounye a, sèlman idantite/paramèt biznis la vin reyèl (non, sektè, plan,
 * monnè/to chanj, switch Kès/Vant, Estòk, add-on Otèl/Lekòl, taks). Kolèksyon
 * yo (pwodwi, faktè, tach, anplwaye, founisè, elèv, elatriye) rete done demo
 * jiskaske chak modil branche sou pwòp tab Supabase pa yo pi devan.
 */
import { supabase } from "@/integrations/supabase/client";
import { BUSINESSES, type Business, type PlanId } from "./data";

export async function fetchOwnedBusinesses(userId: string): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[real-business] echèk chajman biznis yo", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Modèl kolèksyon demo (pwodwi/faktè/tach/elatriye) — rete plasholder pou kounye a.
  const template = BUSINESSES[0]!;

  return data.map((row): Business => ({
    ...template,
    id: row.id,
    name: row.name,
    sector: row.sector,
    plan: row.plan as PlanId,
    currency: row.currency as "HTG" | "USD",
    rate: row.exchange_rate,
    posEnabled: row.pos_enabled,
    stockEnabled: row.stock_enabled,
    hotelAddon: row.hotel_addon,
    schoolAddon: row.school_addon,
    taxRate: row.tax_rate,
  }));
}
