import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PLANS, money } from "@/lib/gboss/data";
import {
  createStudent,
  deleteStudent,
  fetchStudents,
  setStudentStatus,
  type StudentInput,
  type StudentRow,
  type StudentStatus,
} from "@/lib/gboss/students";

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

const EMPTY_FORM: StudentInput = { name: "", classroom: "", guardian: "" };

function School() {
  const { biz } = useBiz();
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({ queryKey: ["students", biz.id], queryFn: () => fetchStudents(biz.id) });
  const students = studentsQuery.data ?? [];
  const classrooms = Array.from(new Set(students.map((s) => s.classroom).filter((c): c is string => !!c)));
  const withAvg = students.filter((s) => s.average !== null);
  const avg = withAvg.length ? withAvg.reduce((s, x) => s + (x.average ?? 0), 0) / withAvg.length : 0;
  const withAtt = students.filter((s) => s.attendance !== null);
  const attendance = withAtt.length ? withAtt.reduce((s, x) => s + (x.attendance ?? 0), 0) / withAtt.length : 0;
  const billing = students.length * PLANS.kanpis.price;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StudentInput>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Antre non elèv la.");
      await createStudent(biz.id, form);
    },
    onSuccess: () => {
      toast.success("Élève inscrit");
      setOpen(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["students", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan enskripsyon an"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StudentStatus }) => setStudentStatus(id, status),
    onSuccess: () => {
      toast.success("Statut mis à jour");
      queryClient.invalidateQueries({ queryKey: ["students", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteStudent(id),
    onSuccess: () => {
      toast.success("Élève retiré");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["students", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  return (
    <div>
      <PageHeader
        title="G-Kanpis"
        subtitle={`${students.length} élèves · ${classrooms.length} classes · ${PLANS.kanpis.price} HTG/mois par élève`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Inscrire un élève
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel élève</DialogTitle>
                <DialogDescription>Ajouté directement à votre liste d'élèves.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-name">Nom complet</Label>
                  <Input id="e-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-class">Classe</Label>
                  <Input
                    id="e-class"
                    value={form.classroom ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, classroom: e.target.value || null }))}
                    placeholder="Ex: 6e Année A"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-guardian">Tuteur / Parent</Label>
                  <Input
                    id="e-guardian"
                    value={form.guardian ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, guardian: e.target.value || null }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Inscrire
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Élèves" value={String(students.length)} tone="blue" icon={<GraduationCap className="size-4" />} />
        <KpiCard label="Moyenne générale" value={withAvg.length ? `${avg.toFixed(1)}/20` : "—"} tone="purple" />
        <KpiCard label="Présence moyenne" value={withAtt.length ? `${Math.round(attendance)}%` : "—"} tone="green" />
        <KpiCard label="Facturation mensuelle" value={money(billing, "HTG")} tone="orange" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Élèves" className="lg:col-span-2">
          {studentsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement...
            </div>
          ) : students.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun élève enregistré — cliquez sur « Inscrire un élève ».
            </p>
          ) : (
            <div className="space-y-3">
              {students.map((s) => (
                <div key={s.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="gb-num truncate text-xs text-muted-foreground">
                        {s.classroom ?? "Sans classe"} · tuteur : {s.guardian ?? "—"}
                      </p>
                    </div>
                    <span className="gb-num text-sm font-semibold">{s.average !== null ? `${s.average.toFixed(1)}/20` : "—"}</span>
                    <StatusPill tone={s.status === "actif" ? "ok" : "crit"}>
                      {s.status === "actif" ? "Actif" : "Restreint"}
                    </StatusPill>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        statusMutation.mutate({
                          id: s.id,
                          status: s.status === "actif" ? "restriksyone" : "actif",
                        })
                      }
                    >
                      {s.status === "actif" ? "Restreindre" : "Réactiver"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={s.attendance ?? 0} tone={(s.attendance ?? 0) >= 85 ? "green" : "orange"} />
                    <span className="gb-num shrink-0 text-xs text-muted-foreground">
                      {s.attendance !== null ? `${s.attendance}% présence` : "présence non enregistrée"}
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
        </Panel>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer « {deleteTarget?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>Aksyon sa a pa ka anile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
