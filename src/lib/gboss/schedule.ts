import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ScheduleRow = Database["public"]["Tables"]["class_schedule"]["Row"];
export type ScheduleInput = {
  classroom: string;
  subject: string;
  teacher_name: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export const DAYS_OF_WEEK = [
  { id: 1, label: "Lendi" },
  { id: 2, label: "Madi" },
  { id: 3, label: "Mèkredi" },
  { id: 4, label: "Jedi" },
  { id: 5, label: "Vandredi" },
  { id: 6, label: "Samdi" },
] as const;

export async function fetchSchedule(businessId: string): Promise<ScheduleRow[]> {
  const { data, error } = await supabase
    .from("class_schedule")
    .select("*")
    .eq("business_id", businessId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createScheduleEntry(businessId: string, input: ScheduleInput): Promise<void> {
  const { error } = await supabase.from("class_schedule").insert({ business_id: businessId, ...input });
  if (error) throw error;
}

export async function deleteScheduleEntry(id: string): Promise<void> {
  const { error } = await supabase.from("class_schedule").delete().eq("id", id);
  if (error) throw error;
}
