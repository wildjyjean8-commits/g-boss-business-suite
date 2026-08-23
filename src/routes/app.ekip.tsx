import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Power, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
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
import { PLANS, ROLES } from "@/lib/gboss/data";
import {
  createMember,
  fetchMembers,
  fetchPerformance,
  setMemberActive,
  type MemberInput,
} from "@/lib/gboss/members";

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

const EMPTY_FORM: MemberInput = { name: "", role: ROLES[0]!, department: "", phone: "" };

function Team() {
  const { biz } = useBiz();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["members", biz.id],
    queryFn: () => fetchMembers(biz.id),
  });
  const performanceQuery = useQuery({
    queryKey: ["members-performance", biz.id],
    queryFn: () => fetchPerformance(biz.id),
  });
  const team = membersQuery.data ?? [];
  const performance = performanceQuery.data ?? [];
  const seats = PLANS[biz.plan].seats;
  const present = team.filter((e) => e.present).length;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemberInput>(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Antre non anplwaye a.");
      if (seats > 0 && team.length >= seats) {
        throw new Error("Limite de places atteinte — passez à un plan supérieur");
      }
      await createMember(biz.id, form);
    },
    onSuccess: () => {
      toast.success("Membre ajouté");
      setOpen(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["members", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan ajoute a"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => setMemberActive(id, active),
    onSuccess: () => {
      toast.success("Statut mis à jour");
      queryClient.invalidateQueries({ queryKey: ["members", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  return (
    <div>
      <PageHeader
        title="Équipe"
        subtitle={`${team.length} membres · ${seats ? `${seats} places incluses (${PLANS[biz.plan].name})` : PLANS[biz.plan].name}`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="size-4" /> Inviter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau membre</DialogTitle>
                <DialogDescription>Le membre est ajouté directement à votre équipe.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-name">Nom complet</Label>
                  <Input id="m-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Rôle</Label>
                  <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-dept">Département</Label>
                  <Input
                    id="m-dept"
                    value={form.department ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value || null }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-phone">Téléphone</Label>
                  <Input
                    id="m-phone"
                    value={form.phone ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
          {membersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement...
            </div>
          ) : team.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun membre pour l'instant — cliquez sur « Inviter ».
            </p>
          ) : (
            <div className="space-y-3">
              {team.map((e) => {
                const perf = performance.find((p) => p.member_id === e.id);
                const done = perf?.tasks_done ?? 0;
                const totalT = perf?.tasks_total ?? 0;
                return (
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
                          {e.role} · {e.department ?? "—"} · {e.phone ?? "—"}
                        </p>
                      </div>
                      <StatusPill tone={e.present ? "ok" : "neutral"}>{e.present ? "Présent" : "Absent"}</StatusPill>
                      {!e.active ? <StatusPill tone="crit">Désactivé</StatusPill> : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title={e.active ? "Désactiver" : "Réactiver"}
                        onClick={() => toggleActiveMutation.mutate({ id: e.id, active: !e.active })}
                      >
                        <Power className="size-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={(done / Math.max(1, totalT)) * 100} tone="green" />
                      <span className="gb-num shrink-0 text-xs text-muted-foreground">
                        {done}/{totalT} tâches
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
        </Panel>
      </div>
    </div>
  );
}
