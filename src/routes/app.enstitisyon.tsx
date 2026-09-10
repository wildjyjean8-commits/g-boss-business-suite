import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarCheck, GraduationCap, Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  createStudentPayment,
  deleteStudent,
  fetchStudentPayments,
  fetchStudents,
  setStudentStatus,
  type StudentInput,
  type StudentPaymentInput,
  type StudentRow,
  type StudentStatus,
} from "@/lib/gboss/students";
import {
  createGrade,
  deleteGrade,
  fetchAttendanceForDate,
  fetchGrades,
  saveAttendanceBatch,
  type AttendanceMark,
  type GradeInput,
  type GradeRow,
} from "@/lib/gboss/student-records";

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

  // ---------- Peman eskolarite ----------
  const paymentsQuery = useQuery({ queryKey: ["student-payments", biz.id], queryFn: () => fetchStudentPayments(biz.id) });
  const payments = paymentsQuery.data ?? [];

  const [payTarget, setPayTarget] = useState<StudentRow | null>(null);
  const EMPTY_PAYMENT: Omit<StudentPaymentInput, "student_id"> = {
    label: "Frè eskolarite",
    amount_due: 0,
    amount_paid: 0,
    due_date: null,
  };
  const [payForm, setPayForm] = useState(EMPTY_PAYMENT);

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!payTarget) return;
      if (!payForm.amount_paid || payForm.amount_paid <= 0) throw new Error("Antre yon montan valab.");
      await createStudentPayment(biz.id, { student_id: payTarget.id, ...payForm });
    },
    onSuccess: () => {
      toast.success("Peman anrejistre — revni a ajoute nan Kontabilite otomatikman");
      setPayTarget(null);
      setPayForm(EMPTY_PAYMENT);
      queryClient.invalidateQueries({ queryKey: ["student-payments", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan peman an"),
  });

  // ---------- Nòt ----------
  const gradesQuery = useQuery({ queryKey: ["grades", biz.id], queryFn: () => fetchGrades(biz.id) });
  const grades = gradesQuery.data ?? [];

  const [gradeOpen, setGradeOpen] = useState(false);
  const EMPTY_GRADE: GradeInput = { student_id: "", subject: "", period: "", grade: 0, max_grade: 20, comment: null };
  const [gradeForm, setGradeForm] = useState<GradeInput>(EMPTY_GRADE);
  const [deleteGradeTarget, setDeleteGradeTarget] = useState<GradeRow | null>(null);

  const createGradeMutation = useMutation({
    mutationFn: async () => {
      if (!gradeForm.student_id) throw new Error("Chwazi yon elèv.");
      if (!gradeForm.subject.trim()) throw new Error("Antre matyè a.");
      if (!gradeForm.period.trim()) throw new Error("Antre peryòd la.");
      if (gradeForm.max_grade <= 0) throw new Error("Nòt maksimòm dwe pi gran pase 0.");
      await createGrade(biz.id, gradeForm);
    },
    onSuccess: () => {
      toast.success("Nòt anrejistre — mwayèn elèv la mete ajou otomatikman");
      setGradeOpen(false);
      setGradeForm(EMPTY_GRADE);
      queryClient.invalidateQueries({ queryKey: ["grades", biz.id] });
      queryClient.invalidateQueries({ queryKey: ["students", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteGradeMutation = useMutation({
    mutationFn: async (id: string) => deleteGrade(id),
    onSuccess: () => {
      toast.success("Nòt efase");
      setDeleteGradeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["grades", biz.id] });
      queryClient.invalidateQueries({ queryKey: ["students", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  // ---------- Prezans ----------
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attClassroom, setAttClassroom] = useState<string>("__all");
  const attendanceForDateQuery = useQuery({
    queryKey: ["attendance-date", biz.id, attDate],
    queryFn: () => fetchAttendanceForDate(biz.id, attDate),
  });
  const attendanceToday = attendanceForDateQuery.data ?? [];
  const [marks, setMarks] = useState<Record<string, boolean>>({});

  const studentsInScope = useMemo(
    () => (attClassroom === "__all" ? students : students.filter((s) => s.classroom === attClassroom)),
    [students, attClassroom],
  );

  function isPresent(studentId: string): boolean {
    if (studentId in marks) return marks[studentId] ?? true;
    const existing = attendanceToday.find((a) => a.student_id === studentId);
    return existing ? existing.present : true;
  }

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      const batch: AttendanceMark[] = studentsInScope.map((s) => ({
        student_id: s.id,
        present: isPresent(s.id),
        note: null,
      }));
      await saveAttendanceBatch(biz.id, attDate, batch);
    },
    onSuccess: () => {
      toast.success("Prezans anrejistre — pousantaj elèv yo mete ajou otomatikman");
      setMarks({});
      queryClient.invalidateQueries({ queryKey: ["attendance-date", biz.id, attDate] });
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

      <div className="mt-4">
        <Tabs defaultValue="eleves">
          <TabsList>
            <TabsTrigger value="eleves">Élèves</TabsTrigger>
            <TabsTrigger value="notes">Nòt</TabsTrigger>
            <TabsTrigger value="presences">Prezans</TabsTrigger>
          </TabsList>

          <TabsContent value="eleves" className="mt-4">
      <div className="grid gap-4 lg:grid-cols-3">
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
                      onClick={() => {
                        setPayTarget(s);
                        setPayForm(EMPTY_PAYMENT);
                      }}
                    >
                      <Receipt className="size-3.5" /> Peman
                    </Button>
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

      <Dialog open={!!payTarget} onOpenChange={(v) => !v && setPayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Peman — {payTarget?.name}</DialogTitle>
            <DialogDescription>Sa ap ajoute otomatikman kòm revni nan Kontabilite.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-label">Rezon</Label>
              <Input id="pf-label" value={payForm.label} onChange={(e) => setPayForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pf-due">Montan total dwe</Label>
                <Input id="pf-due" type="number" value={payForm.amount_due || ""} onChange={(e) => setPayForm((f) => ({ ...f, amount_due: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-paid">Montan peye</Label>
                <Input id="pf-paid" type="number" value={payForm.amount_paid || ""} onChange={(e) => setPayForm((f) => ({ ...f, amount_paid: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => paymentMutation.mutate()} disabled={paymentMutation.isPending}>
              {paymentMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Anrejistre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Panel title="Dènye peman eskolarite (Kontabilite)" className="mt-4">
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Pa gen peman anrejistre ankò.</p>
        ) : (
          <div className="space-y-2.5">
            {payments.slice(0, 8).map((p) => {
              const st = students.find((s) => s.id === p.student_id);
              return (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <Receipt className="size-4 shrink-0 text-kpi-orange" />
                  <span className="min-w-0 flex-1 truncate">
                    {st?.name ?? "Elèv"} · {p.label}
                  </span>
                  <StatusPill tone={p.status === "paye" ? "ok" : p.status === "pasyèl" ? "low" : "crit"}>{p.status}</StatusPill>
                  <span className="gb-num font-semibold">{money(p.amount_paid, biz.currency)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Panel
              title="Nòt"
              action={
                <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="size-4" /> Nouvo nòt
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajoute yon nòt</DialogTitle>
                      <DialogDescription>Mwayèn elèv la ap kalkile otomatikman apre sa.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Elèv</Label>
                        <Select
                          value={gradeForm.student_id}
                          onValueChange={(v) => setGradeForm((f) => ({ ...f, student_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chwazi yon elèv" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="g-subject">Matyè</Label>
                          <Input
                            id="g-subject"
                            value={gradeForm.subject}
                            onChange={(e) => setGradeForm((f) => ({ ...f, subject: e.target.value }))}
                            placeholder="Ex: Matematik"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="g-period">Peryòd</Label>
                          <Input
                            id="g-period"
                            value={gradeForm.period}
                            onChange={(e) => setGradeForm((f) => ({ ...f, period: e.target.value }))}
                            placeholder="Ex: Trimès 1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="g-grade">Nòt</Label>
                          <Input
                            id="g-grade"
                            type="number"
                            min={0}
                            value={gradeForm.grade}
                            onChange={(e) => setGradeForm((f) => ({ ...f, grade: Number(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="g-max">Sou</Label>
                          <Input
                            id="g-max"
                            type="number"
                            min={1}
                            value={gradeForm.max_grade}
                            onChange={(e) => setGradeForm((f) => ({ ...f, max_grade: Number(e.target.value) || 20 }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="g-comment">Komantè (opsyonèl)</Label>
                        <Input
                          id="g-comment"
                          value={gradeForm.comment ?? ""}
                          onChange={(e) => setGradeForm((f) => ({ ...f, comment: e.target.value || null }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => createGradeMutation.mutate()} disabled={createGradeMutation.isPending}>
                        {createGradeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                        Anrejistre
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              }
            >
              {gradesQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Chajman...
                </div>
              ) : grades.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Okenn nòt anrejistre ankò.</p>
              ) : (
                <div className="space-y-2">
                  {grades.map((g) => {
                    const st = students.find((s) => s.id === g.student_id);
                    return (
                      <div key={g.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                        <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{st?.name ?? "Elèv"}</span>
                          <span className="text-muted-foreground"> · {g.subject} · {g.period}</span>
                        </span>
                        <span className="gb-num font-semibold">
                          {g.grade}/{g.max_grade}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteGradeTarget(g)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="presences" className="mt-4">
            <Panel
              title="Prezans"
              action={
                <div className="flex items-center gap-2">
                  <Select value={attClassroom} onValueChange={setAttClassroom}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Tout klas</SelectItem>
                      {classrooms.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={attDate}
                    onChange={(e) => {
                      setAttDate(e.target.value);
                      setMarks({});
                    }}
                    className="w-40"
                  />
                  <Button
                    size="sm"
                    onClick={() => saveAttendanceMutation.mutate()}
                    disabled={saveAttendanceMutation.isPending || studentsInScope.length === 0}
                  >
                    {saveAttendanceMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Anrejistre
                  </Button>
                </div>
              }
            >
              {studentsInScope.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Okenn elèv nan klas sa a.</p>
              ) : (
                <div className="space-y-2">
                  {studentsInScope.map((s) => {
                    const present = isPresent(s.id);
                    return (
                      <div key={s.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                        <CalendarCheck className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                        <span className="gb-num text-xs text-muted-foreground">{s.classroom ?? "Sans classe"}</span>
                        <Button
                          size="sm"
                          variant={present ? "outline" : "destructive"}
                          onClick={() => setMarks((m) => ({ ...m, [s.id]: !present }))}
                        >
                          {present ? "Prezan" : "Absan"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </TabsContent>
        </Tabs>
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
      <AlertDialog open={!!deleteGradeTarget} onOpenChange={(v) => !v && setDeleteGradeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase nòt sa a?</AlertDialogTitle>
            <AlertDialogDescription>Aksyon sa a pa ka anile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGradeTarget && deleteGradeMutation.mutate(deleteGradeTarget.id)}
            >
              Efase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
