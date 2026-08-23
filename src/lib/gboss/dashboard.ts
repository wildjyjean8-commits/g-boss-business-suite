import { supabase } from "@/integrations/supabase/client";

export type WeekPoint = { day: string; revenue: number; expense: number; orders: number };

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export async function fetchWeekChart(businessId: string): Promise<WeekPoint[]> {
  const { data, error } = await supabase
    .from("v_week_metrics")
    .select("*")
    .eq("business_id", businessId);

  if (error) throw error;

  const byDay = new Map((data ?? []).map((r) => [r.day, r]));
  return DAYS.map((day) => {
    const row = byDay.get(day);
    return {
      day,
      revenue: row?.revenue ?? 0,
      expense: row?.expense ?? 0,
      orders: row?.orders ?? 0,
    };
  });
}
