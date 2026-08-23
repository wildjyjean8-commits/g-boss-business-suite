import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskStatus = "afe" | "ankou" | "revizyon" | "bloke" | "fini";
export type TaskPriority = "haute" | "moyenne" | "basse";

export type TaskInput = {
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  progress: number;
};

export async function fetchTasks(businessId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createTask(businessId: string, input: TaskInput): Promise<void> {
  const { error } = await supabase.from("tasks").insert({
    business_id: businessId,
    ...input,
  });
  if (error) throw error;
}

export async function updateTaskStatus(id: string, status: TaskStatus, progress?: number): Promise<void> {
  const patch: Partial<TaskRow> = { status };
  if (progress !== undefined) patch.progress = progress;
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export function taskMetrics(tasks: TaskRow[]) {
  const todo = tasks.filter((t) => t.status === "afe");
  const doing = tasks.filter((t) => t.status === "ankou");
  const blocked = tasks.filter((t) => t.status === "bloke");
  const review = tasks.filter((t) => t.status === "revizyon");
  const done = tasks.filter((t) => t.status === "fini");
  const unassigned = tasks.filter((t) => !t.assignee_id).length;
  return { total: tasks.length, todo, doing, blocked, review, done, unassigned };
}

const STATUS_PROGRESS: Record<TaskStatus, number> = {
  afe: 0,
  ankou: 40,
  revizyon: 75,
  bloke: 40,
  fini: 100,
};

export function defaultProgressForStatus(status: TaskStatus): number {
  return STATUS_PROGRESS[status];
}
