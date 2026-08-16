import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { taskMetrics, type Task } from "@/lib/gboss/data";

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

const COLUMNS: { status: Task["status"]; label: string; tone: "blue" | "purple" | "orange" | "red" | "green" }[] = [
  { status: "afe", label: "À faire", tone: "blue" },
  { status: "ankou", label: "En cours", tone: "purple" },
  { status: "revizyon", label: "Révision", tone: "orange" },
  { status: "bloke", label: "Bloqué", tone: "red" },
  { status: "fini", label: "Terminé", tone: "green" },
];

const PRIORITY = {
  haute: { tone: "crit" as const, label: "Haute" },
  moyenne: { tone: "low" as const, label: "Moyenne" },
  basse: { tone: "neutral" as const, label: "Basse" },
};

function Tasks() {
  const { biz } = useBiz();
  const m = taskMetrics(biz);

  return (
    <div>
      <PageHeader
        title="Tâches"
        subtitle={`${m.total} tâches · ${m.done.length} terminées · ${m.unassigned} non assignées`}
        actions={
          <Button size="sm" onClick={() => toast.success("Nouvelle tâche créée (démonstration)")}>
            <Plus className="size-4" /> Nouvelle tâche
          </Button>
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

      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = biz.tasks.filter((t) => t.status === col.status);
          return (
            <section key={col.status} className="gb-card p-3">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold">{col.label}</h3>
                <span className="gb-num rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                  {items.length}
                </span>
              </header>
              <div className="space-y-2.5">
                {items.map((t) => (
                  <article key={t.id} className="rounded-xl border border-border bg-background p-3">
                    <p className="text-sm font-medium leading-snug">{t.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusPill tone={PRIORITY[t.priority].tone}>{PRIORITY[t.priority].label}</StatusPill>
                      <span className="gb-num text-[11px] text-muted-foreground">{t.due}</span>
                    </div>
                    <div className="mt-2.5">
                      <ProgressBar value={t.progress} tone={col.tone} />
                    </div>
                    <p className="gb-num mt-2 truncate text-[11px] text-muted-foreground">
                      {t.assignee ?? "Non assignée"}
                    </p>
                  </article>
                ))}
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
    </div>
  );
}
