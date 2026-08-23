import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchMembers } from "@/lib/gboss/members";
import {
  createTask,
  defaultProgressForStatus,
  deleteTask,
  fetchTasks,
  taskMetrics,
  updateTaskStatus,
  type TaskInput,
  type TaskPriority,
  type TaskRow,
  type TaskStatus,
} from "@/lib/gboss/tasks";

export const Route = createFileRoute("/app/tach")({
  head: () => ({
    meta: [
      { title: "Tâches — G-Boss" },
      { name: "description", content: "Tableau Kanban : à faire, en cours, révision, bloqué et terminé." },
      { property: "og:title", content: "Tâches — G-Boss" },
      { property: "og:description", content: "Organisez le travail de votre équipe en Kanban." },
    ],
  }),
  component: Tasks,
});

const COLUMNS: { status: TaskStatus; label: string; tone: "blue" | "purple" | "orange" | "red" | "green" }[] = [
  { status: "afe", label: "À faire", tone: "blue" },
  { status: "ankou", label: "En cours", tone: "purple" },
  { status: "revizyon", label: "Révision", tone: "orange" },
  { status: "bloke", label: "Bloqué", tone: "red" },
  { status: "fini", label: "Terminé", tone: "green" },
];

const PRIORITY: Record<TaskPriority, { tone: "crit" | "low" | "neutral"; label: string }> = {
  haute: { tone: "crit", label: "Haute" },
  moyenne: { tone: "low", label: "Moyenne" },
  basse: { tone: "neutral", label: "Basse" },
};

const EMPTY_FORM: TaskInput = {
  title: "",
  priority: "moyenne",
  status: "afe",
  assignee_id: null,
  due_date: null,
  progress: 0,
};

function Tasks() {
  const { biz } = useBiz();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({ queryKey: ["tasks", biz.id], queryFn: () => fetchTasks(biz.id) });
  const membersQuery = useQuery({ queryKey: ["members", biz.id], queryFn: () => fetchMembers(biz.id) });
  const tasks = tasksQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const m = taskMetrics(tasks);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TaskInput>(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Antre non tach la.");
      await createTask(biz.id, form);
    },
    onSuccess: () => {
      toast.success("Tâche créée");
      setOpen(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["tasks", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan kreyasyon tach la"),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status, defaultProgressForStatus(status)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", biz.id] }),
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success("Tâche efase");
      queryClient.invalidateQueries({ queryKey: ["tasks", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  return (
    <div>
      <PageHeader
        title="Tâches"
        subtitle={`${m.total} tâches · ${m.done.length} terminées · ${m.unassigned} non assignées`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle tâche</DialogTitle>
                <DialogDescription>La tâche est ajoutée directement au tableau.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="t-title">Titre</Label>
                  <Input id="t-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Priorité</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="basse">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigné à</Label>
                  <Select
                    value={form.assignee_id ?? "none"}
                    onValueChange={(v) => setForm((f) => ({ ...f, assignee_id: v === "none" ? null : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non assignée</SelectItem>
                      {members.map((mem) => (
                        <SelectItem key={mem.id} value={mem.id}>
                          {mem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-due">Échéance</Label>
                  <Input
                    id="t-due"
                    type="date"
                    value={form.due_date ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value || null }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="En cours" value={String(m.doing.length)} tone="purple" />
        <KpiCard label="Bloquées" value={String(m.blocked.length)} tone="red" />
        <KpiCard label="En révision" value={String(m.review.length)} tone="orange" />
        <KpiCard
          label="Progression"
          value={`${Math.round((m.done.length / Math.max(1, m.total)) * 100)}%`}
          tone="green"
        />
      </div>

      {tasksQuery.isLoading ? (
        <div className="mt-6 flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Chargement des tâches...
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.status);
            return (
              <section key={col.status} className="gb-card p-3">
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold">{col.label}</h3>
                  <span className="gb-num rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                    {items.length}
                  </span>
                </header>
                <div className="space-y-2.5">
                  {items.map((t: TaskRow) => {
                    const assignee = members.find((mem) => mem.id === t.assignee_id);
                    return (
                      <article key={t.id} className="rounded-xl border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">{t.title}</p>
                          <button
                            type="button"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMutation.mutate(t.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <StatusPill tone={PRIORITY[t.priority as TaskPriority].tone}>
                            {PRIORITY[t.priority as TaskPriority].label}
                          </StatusPill>
                          <span className="gb-num text-[11px] text-muted-foreground">{t.due_date ?? "—"}</span>
                        </div>
                        <div className="mt-2.5">
                          <ProgressBar value={t.progress} tone={col.tone} />
                        </div>
                        <p className="gb-num mt-2 truncate text-[11px] text-muted-foreground">
                          {assignee?.name ?? "Non assignée"}
                        </p>
                        <Select
                          value={t.status}
                          onValueChange={(v) => moveMutation.mutate({ id: t.id, status: v as TaskStatus })}
                        >
                          <SelectTrigger className="mt-2 h-7 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMNS.map((c) => (
                              <SelectItem key={c.status} value={c.status}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </article>
                    );
                  })}
                  {items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                      Vide
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
