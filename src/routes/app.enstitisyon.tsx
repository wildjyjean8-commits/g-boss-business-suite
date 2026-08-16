import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { PLANS, money } from "@/lib/gboss/data";

export const Route = createFileRoute("/app/enstitisyon")({
  head: () => ({
    meta: [
      { title: "G-Kanpis — Gestion scolaire" },
      { name: "description", content: "Élèves, classes, moyennes, présences et frais de scolarité avec G-Kanpis." },
      { property: "og:title", content: "G-Kanpis — Gestion scolaire" },
      { property: "og:description", content: "Suivi des élèves, notes, présences et paiements scolaires." },
    ],
  }),
  component: School,
});

function School() {
  const { biz } = useBiz();
  const students = biz.students;
  const classrooms = Array.from(new Set(students.map((s) => s.classroom)));
  const avg = students.length
    ? students.reduce((s, x) => s + x.average, 0) / students.length
    : 0;
  const attendance = students.length
    ? students.reduce((s, x) => s + x.attendance, 0) / students.length
    : 0;
  const billing = students.length * PLANS.kanpis.price;

  return (
    <div>
      <PageHeader
        title="G-Kanpis"
        subtitle={`${students.length} élèves · ${classrooms.length} classes · ${PLANS.kanpis.price} HTG/mois par élève`}
        actions={
          <Button size="sm" onClick={() => toast.success("Élève inscrit (démonstration)")}>
            <Plus className="size-4" /> Inscrire un élève
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Élèves" value={String(students.length)} tone="blue" icon={<GraduationCap className="size-4" />} />
        <KpiCard label="Moyenne générale" value={`${avg.toFixed(1)}/20`} tone="purple" />
        <KpiCard label="Présence moyenne" value={`${Math.round(attendance)}%`} tone="green" />
        <KpiCard label="Facturation mensuelle" value={money(billing, "HTG")} tone="orange" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Élèves" className="lg:col-span-2">
          {students.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun élève enregistré pour ce business.
            </p>
          ) : (
            <div className="space-y-3">
              {students.map((s) => (
                <div key={s.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="gb-num truncate text-xs text-muted-foreground">
                        {s.classroom} · tuteur : {s.guardian}
                      </p>
                    </div>
                    <span className="gb-num text-sm font-semibold">{s.average.toFixed(1)}/20</span>
                    <StatusPill tone={s.status === "actif" ? "ok" : "crit"}>
                      {s.status === "actif" ? "Actif" : "Restreint"}
                    </StatusPill>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={s.attendance} tone={s.attendance >= 85 ? "green" : "orange"} />
                    <span className="gb-num shrink-0 text-xs text-muted-foreground">
                      {s.attendance}% présence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Classes">
          {classrooms.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune classe.</p>
          ) : (
            <ul className="space-y-2">
              {classrooms.map((c) => (
                <li key={c} className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                  <span className="truncate text-sm font-medium">{c}</span>
                  <span className="gb-num text-xs text-muted-foreground">
                    {students.filter((s) => s.classroom === c).length} élèves
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => toast.success("Bulletins générés (démonstration)")}
          >
            Générer les bulletins
          </Button>
        </Panel>
      </div>
    </div>
  );
}
