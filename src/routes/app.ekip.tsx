import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { PLANS, ROLES } from "@/lib/gboss/data";

export const Route = createFileRoute("/app/ekip")({
  head: () => ({
    meta: [
      { title: "Équipe — G-Boss" },
      { name: "description", content: "Gérez les employés, rôles, présences et performance de votre équipe." },
      { property: "og:title", content: "Équipe — G-Boss" },
      { property: "og:description", content: "Rôles, permissions, présences et suivi des tâches par employé." },
    ],
  }),
  component: Team,
});

function Team() {
  const { biz } = useBiz();
  const team = biz.employees;
  const seats = PLANS[biz.plan].seats;
  const present = team.filter((e) => e.present).length;

  return (
    <div>
      <PageHeader
        title="Équipe"
        subtitle={`${team.length} membres · ${seats ? `${seats} places incluses (${PLANS[biz.plan].name})` : PLANS[biz.plan].name}`}
        actions={
          <Button
            size="sm"
            onClick={() =>
              team.length >= seats && seats > 0
                ? toast.error("Limite de places atteinte — passez à un plan supérieur")
                : toast.success("Invitation envoyée (démonstration)")
            }
          >
            <UserPlus className="size-4" /> Inviter
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Membres" value={String(team.length)} tone="blue" icon={<Users className="size-4" />} />
        <KpiCard label="Présents aujourd'hui" value={`${present}/${team.length}`} tone="green" />
        <KpiCard label="Actifs" value={String(team.filter((e) => e.active).length)} tone="purple" />
        <KpiCard
          label="Places restantes"
          value={seats ? String(Math.max(0, seats - team.length)) : "∞"}
          tone="orange"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Membres de l'équipe" className="lg:col-span-2">
          <div className="space-y-3">
            {team.map((e) => (
              <div key={e.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
                    {e.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="gb-num truncate text-xs text-muted-foreground">
                      {e.role} · {e.department} · {e.phone}
                    </p>
                  </div>
                  <StatusPill tone={e.present ? "ok" : "neutral"}>
                    {e.present ? "Présent" : "Absent"}
                  </StatusPill>
                  {!e.active ? <StatusPill tone="crit">Désactivé</StatusPill> : null}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={(e.tasksDone / Math.max(1, e.tasksTotal)) * 100} tone="green" />
                  <span className="gb-num shrink-0 text-xs text-muted-foreground">
                    {e.tasksDone}/{e.tasksTotal} tâches
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Rôles & permissions">
          <ul className="space-y-2">
            {ROLES.map((r) => (
              <li key={r} className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2">
                <span className="truncate text-sm font-medium">{r}</span>
                <span className="gb-num text-xs text-muted-foreground">
                  {team.filter((e) => e.role === r).length}
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => toast.success("Permissions mises à jour (démonstration)")}
          >
            Modifier les permissions
          </Button>
        </Panel>
      </div>
    </div>
  );
}
