import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type HotelUnitRow = Database["public"]["Tables"]["hotel_units"]["Row"];
export type UnitStatus = "libre" | "occupe" | "nettoyage";

export type HotelUnitInput = {
  label: string;
  number: string;
  type: string;
  bedrooms: number;
  living_room: boolean;
  kitchen: boolean;
  bathrooms: number;
  capacity: number;
  amenities: string[];
  price_per_night: number;
};

export async function fetchHotelUnits(businessId: string): Promise<HotelUnitRow[]> {
  const { data, error } = await supabase
    .from("hotel_units")
    .select("*")
    .eq("business_id", businessId)
    .order("number", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createHotelUnit(businessId: string, input: HotelUnitInput): Promise<void> {
  const { error } = await supabase.from("hotel_units").insert({
    business_id: businessId,
    ...input,
  });
  if (error) throw error;
}

export async function setHotelUnitStatus(id: string, status: UnitStatus): Promise<void> {
  const { error } = await supabase.from("hotel_units").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteHotelUnit(id: string): Promise<void> {
  const { error } = await supabase.from("hotel_units").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Rezèvasyon (kreye revni nan Kontabilite otomatikman) ----------

export type ReservationRow = Database["public"]["Tables"]["hotel_reservations"]["Row"];

export type ReservationInput = {
  unit_id: string;
  guest_name: string;
  guest_id_number: string | null;
  nationality: string | null;
  adults: number;
  children: number;
  checkin: string;
  checkout: string;
  amount_paid: number;
  agreed_damage_policy: boolean;
  agreed_noise_policy: boolean;
};

export async function fetchReservations(businessId: string): Promise<ReservationRow[]> {
  const { data, error } = await supabase
    .from("hotel_reservations")
    .select("*")
    .eq("business_id", businessId)
    .order("checkin", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createReservation(businessId: string, input: ReservationInput): Promise<void> {
  const { error } = await supabase.from("hotel_reservations").insert({
    business_id: businessId,
    ...input,
  });
  if (error) throw error;
}

export async function updateReservationAmountPaid(id: string, amountPaid: number): Promise<void> {
  const { error } = await supabase.from("hotel_reservations").update({ amount_paid: amountPaid }).eq("id", id);
  if (error) throw error;
}
