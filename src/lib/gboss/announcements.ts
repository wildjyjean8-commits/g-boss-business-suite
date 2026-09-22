import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];

export async function fetchAnnouncements(businessId: string): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAnnouncement(businessId: string, title: string, body: string): Promise<void> {
  const { error } = await supabase.from("announcements").insert({ business_id: businessId, title: title.trim(), body: body.trim() });
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}
