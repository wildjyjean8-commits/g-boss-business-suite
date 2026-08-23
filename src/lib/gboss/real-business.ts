/**
 * Pon ant vrè tab `businesses` Supabase la ak done demo yo.
 *
 * Idantite/paramèt biznis la (non, sektè, plan, monnè/to chanj, switch Kès/Vant,
 * Estòk, add-on Otèl/Lekòl, taks) soti nan Supabase. Kolèksyon operasyonèl yo
 * (pwodwi, faktè, tach, anplwaye, founisè, chif semenn, inite, elèv) kòmanse
 * VID pou chak vrè biznis — pa gen okenn done fiktif — jiskaske chak modil
 * branche sou pwòp tab Supabase pa yo pi devan.
 */
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { TRIAL_DAYS, type Business, type DayPoint, type PlanId } from "./data";

const EMPTY_WEEK: DayPoint[] = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => ({
  day,
  revenue: 0,
  expense: 0,
  orders: 0,
}));

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

  return data.map((row): Business => ({
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
    legalName: row.legal_name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    taxNumber: row.tax_number,
    logoUrl: row.logo_url,
    products: [],
    invoices: [],
    tasks: [],
    employees: [],
    suppliers: [],
    week: EMPTY_WEEK,
    units: [],
    students: [],
  }));
}

/**
 * Rekiperasyon otomatik : si kont lan konekte (imèl verifye) men pa gen okenn
 * ranje nan `businesses` pou li, sa vle di etap kreyasyon biznis la te echwe
 * apre kreyasyon kont lan (koneksyon pèdi, erè sèvè, elatriye). Nan ka sa a,
 * rekreye biznis la apati metadata (non/sektè/plan/telefòn) ki te deja sove
 * sou kont lan pandan enskripsyon, pou itilizatè a pa blije rekòmanse ditou.
 */
export async function ensureOwnedBusiness(userId: string, user: User): Promise<Business[]> {
  const owned = await fetchOwnedBusinesses(userId);
  if (owned.length > 0) return owned;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaBizName = meta["biz_name"];
  const metaSector = meta["sector"];
  const metaPlan = meta["plan"];
  const metaPhone = meta["phone"];
  const bizName = typeof metaBizName === "string" ? metaBizName.trim() : "";
  if (!bizName) return [];

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("businesses").insert({
    owner_id: userId,
    name: bizName,
    sector: typeof metaSector === "string" ? metaSector : "Autre",
    plan: typeof metaPlan === "string" ? metaPlan : "esansyel",
    status: "essai",
    trial_ends_at: trialEndsAt,
    phone: typeof metaPhone === "string" ? metaPhone : null,
    email: user.email ?? "",
  });

  if (error) {
    console.error("[real-business] echèk rekreyasyon otomatik biznis", error);
    return [];
  }

  return fetchOwnedBusinesses(userId);
}
