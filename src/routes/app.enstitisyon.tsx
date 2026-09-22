import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  GraduationCap,
  Loader2,
  Plus,
  Printer,
  Receipt,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { Calculator } from "@/components/gboss/calculator";
import { KpiCard, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PLANS, FEE_CATEGORIES, money } from "@/lib/gboss/data";
import { fetchSubjects, createSubject, deleteSubject, type SubjectRow } from "@/lib/gboss/subjects";
import {
  fetchSchedule,
  createScheduleEntry,
  deleteScheduleEntry,
  DAYS_OF_WEEK,
  type ScheduleInput,
} from "@/lib/gboss/schedule";
import {
  fetchDisciplineRecords,
  createDisciplineRecord,
  deleteDisciplineRecord,
  DISCIPLINE_CATEGORIES,
  type DisciplineInput,
  type DisciplineCategory,
} from "@/lib/gboss/discipline";
import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  type AnnouncementRow,
} from "@/lib/gboss/announcements";
import { fetchMembers } from "@/lib/gboss/members";
import { printBulletin } from "@/lib/gboss/print-bulletin";
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
    label: "",
    category: "ekolaj",
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

  // ---------- Matières ----------
  const subjectsQuery = useQuery({ queryKey: ["subjects", biz.id], queryFn: () => fetchSubjects(biz.id) });
  const subjects = subjectsQuery.data ?? [];
  const [newSubjectName, setNewSubjectName] = useState("");
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<SubjectRow | null>(null);

  const createSubjectMutation = useMutation({
    mutationFn: async () => {
      if (!newSubjectName.trim()) throw new Error("Antre non matyè a.");
      await createSubject(biz.id, newSubjectName);
    },
    onSuccess: () => {
      toast.success("Matyè ajoute");
      setNewSubjectName("");
      queryClient.invalidateQueries({ queryKey: ["subjects", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
      toast.success("Matyè efase");
      setDeleteSubjectTarget(null);
      queryClient.invalidateQueries({ queryKey: ["subjects", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  // ---------- Bulletins ----------
  const [bulletinStudentId, setBulletinStudentId] = useState<string>("");
  const [bulletinPeriod, setBulletinPeriod] = useState<string>("");
  const bulletinStudent = students.find((s) => s.id === bulletinStudentId) ?? null;
  const bulletinGrades = grades.filter(
    (g) => g.student_id === bulletinStudentId && (!bulletinPeriod || g.period === bulletinPeriod),
  );
  const periods = useMemo(() => [...new Set(grades.map((g) => g.period))], [grades]);

  function handlePrintBulletin() {
    if (!bulletinStudent) {
      toast.error("Chwazi yon elèv.");
      return;
    }
    if (bulletinGrades.length === 0) {
      toast.error("Elèv sa a pa gen nòt pou peryòd sa a.");
      return;
    }
    printBulletin({
      businessName: biz.name,
      logoUrl: biz.logoUrl,
      address: biz.address,
      phone: biz.phone,
      studentName: bulletinStudent.name,
      classroom: bulletinStudent.classroom,
      period: bulletinPeriod || "Ane Eskolè",
      average: bulletinStudent.average,
      attendance: bulletinStudent.attendance,
      lines: bulletinGrades.map((g) => ({
        subject: g.subject,
        period: g.period,
        grade: g.grade,
        max_grade: g.max_grade,
        comment: g.comment,
      })),
    });
  }

  // ---------- Emploi du temps ----------
  const scheduleQuery = useQuery({ queryKey: ["schedule", biz.id], queryFn: () => fetchSchedule(biz.id) });
  const schedule = scheduleQuery.data ?? [];
  const teamQuery = useQuery({ queryKey: ["team-for-schedule", biz.id], queryFn: () => fetchMembers(biz.id) });
  const teachers = teamQuery.data ?? [];
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const EMPTY_SCHEDULE: ScheduleInput = {
    classroom: "",
    subject: "",
    teacher_name: null,
    day_of_week: 1,
    start_time: "08:00",
    end_time: "09:00",
  };
  const [scheduleForm, setScheduleForm] = useState<ScheduleInput>(EMPTY_SCHEDULE);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<string | null>(null);

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleForm.classroom.trim()) throw new Error("Antre non klas la.");
      if (!scheduleForm.subject.trim()) throw new Error("Antre matyè a.");
      await createScheduleEntry(biz.id, scheduleForm);
    },
    onSuccess: () => {
      toast.success("Kou ajoute nan orè a");
      setScheduleOpen(false);
      setScheduleForm(EMPTY_SCHEDULE);
      queryClient.invalidateQueries({ queryKey: ["schedule", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => deleteScheduleEntry(id),
    onSuccess: () => {
      toast.success("Kou efase nan orè a");
      setDeleteScheduleTarget(null);
      queryClient.invalidateQueries({ queryKey: ["schedule", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  // ---------- Discipline ----------
  const disciplineQuery = useQuery({ queryKey: ["discipline", biz.id], queryFn: () => fetchDisciplineRecords(biz.id) });
  const disciplineRecords = disciplineQuery.data ?? [];
  const [disciplineOpen, setDisciplineOpen] = useState(false);
  const EMPTY_DISCIPLINE: DisciplineInput = {
    student_id: "",
    occurred_on: new Date().toISOString().slice(0, 10),
    category: "avètisman",
    description: "",
    action_taken: null,
  };
  const [disciplineForm, setDisciplineForm] = useState<DisciplineInput>(EMPTY_DISCIPLINE);
  const [deleteDisciplineTarget, setDeleteDisciplineTarget] = useState<string | null>(null);

  const createDisciplineMutation = useMutation({
    mutationFn: async () => {
      if (!disciplineForm.student_id) throw new Error("Chwazi yon elèv.");
      if (!disciplineForm.description.trim()) throw new Error("Antre yon deskripsyon.");
      await createDisciplineRecord(biz.id, disciplineForm);
    },
    onSuccess: () => {
      toast.success("Ka disiplinè anrejistre");
      setDisciplineOpen(false);
      setDisciplineForm(EMPTY_DISCIPLINE);
      queryClient.invalidateQueries({ queryKey: ["discipline", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteDisciplineMutation = useMutation({
    mutationFn: (id: string) => deleteDisciplineRecord(id),
    onSuccess: () => {
      toast.success("Ka efase");
      setDeleteDisciplineTarget(null);
      queryClient.invalidateQueries({ queryKey: ["discipline", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  // ---------- Annonces ----------
  const announcementsQuery = useQuery({ queryKey: ["announcements", biz.id], queryFn: () => fetchAnnouncements(biz.id) });
  const announcements = announcementsQuery.data ?? [];
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [deleteAnnounceTarget, setDeleteAnnounceTarget] = useState<AnnouncementRow | null>(null);

  const createAnnouncementMutation = useMutation({
    mutationFn: async () => {
      if (!announceTitle.trim() || !announceBody.trim()) throw new Error("Ranpli tit la ak mesaj la.");
      await createAnnouncement(biz.id, announceTitle, announceBody);
    },
    onSuccess: () => {
      toast.success("Anons pibliye");
      setAnnounceOpen(false);
      setAnnounceTitle("");
      setAnnounceBody("");
      queryClient.invalidateQueries({ queryKey: ["announcements", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      toast.success("Anons efase");
      setDeleteAnnounceTarget(null);
      queryClient.invalidateQueries({ queryKey: ["announcements", biz.id] });
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
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="eleves">Élèves</TabsTrigger>
            <TabsTrigger value="notes">Nòt</TabsTrigger>
            <TabsTrigger value="presences">Prezans</TabsTrigger>
            <TabsTrigger value="matieres">Matières</TabsTrigger>
            <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
            <TabsTrigger value="ore">Emploi du temps</TabsTrigger>
            <TabsTrigger value="disiplin">Discipline</TabsTrigger>
            <TabsTrigger value="anons">Annonces</TabsTrigger>
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
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(s.access_code ?? "");
                        toast.success(`Kòd ${s.access_code} kopye — pou paran/elèv nan pòtay-paran`);
                      }}
                      className="gb-num rounded-md bg-secondary px-2 py-1 font-mono text-xs font-semibold tracking-wider hover:bg-secondary/70"
                      title="Kopye kòd aksè pou paran/elèv"
                    >
                      {s.access_code ?? "—"}
                    </button>
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
              <Label>Kategori</Label>
              <Select value={payForm.category} onValueChange={(v) => setPayForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEE_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-label">Nòt (opsyonèl)</Label>
              <Input
                id="pf-label"
                value={payForm.label}
                onChange={(e) => setPayForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Ex: Janvye 2027"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pf-due">Montan total dwe</Label>
                <div className="flex gap-1.5">
                  <Input id="pf-due" type="number" value={payForm.amount_due || ""} onChange={(e) => setPayForm((f) => ({ ...f, amount_due: Number(e.target.value) }))} />
                  <Calculator onUseResult={(v) => setPayForm((f) => ({ ...f, amount_due: v }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-paid">Montan peye</Label>
                <div className="flex gap-1.5">
                  <Input id="pf-paid" type="number" value={payForm.amount_paid || ""} onChange={(e) => setPayForm((f) => ({ ...f, amount_paid: Number(e.target.value) }))} />
                  <Calculator onUseResult={(v) => setPayForm((f) => ({ ...f, amount_paid: v }))} />
                </div>
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

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Dènye peman eskolarite (Kontabilite)" className="lg:col-span-2">
          {payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Pa gen peman anrejistre ankò.</p>
          ) : (
            <div className="space-y-2.5">
              {payments.slice(0, 8).map((p) => {
                const st = students.find((s) => s.id === p.student_id);
                const catLabel = FEE_CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category;
                return (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <Receipt className="size-4 shrink-0 text-kpi-orange" />
                    <span className="min-w-0 flex-1 truncate">
                      {st?.name ?? "Elèv"} · {catLabel}
                      {p.label ? ` · ${p.label}` : ""}
                    </span>
                    <StatusPill tone={p.status === "paye" ? "ok" : p.status === "pasyèl" ? "low" : "crit"}>{p.status}</StatusPill>
                    <span className="gb-num font-semibold">{money(p.amount_paid, biz.currency)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Rezime pa Kategori">
          {payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Okenn done.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {FEE_CATEGORIES.map((c) => {
                const total = payments.filter((p) => p.category === c.id).reduce((sum, p) => sum + p.amount_paid, 0);
                if (total === 0) return null;
                return (
                  <li key={c.id} className="flex justify-between">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="gb-num font-semibold">{money(total, biz.currency)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
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

          <TabsContent value="matieres" className="mt-4">
            <Panel title="Matières">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createSubjectMutation.mutate();
                }}
                className="mb-4 flex gap-2"
              >
                <Input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Ex: Matematik, Kreyòl, Sayans..."
                />
                <Button type="submit" disabled={createSubjectMutation.isPending} className="gap-2 shrink-0">
                  {createSubjectMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Ajoute
                </Button>
              </form>

              {subjectsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Chajman...
                </div>
              ) : subjects.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Okenn matyè konfigire ankò.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm">
                      {s.name}
                      <button type="button" onClick={() => setDeleteSubjectTarget(s)} className="text-destructive hover:opacity-70">
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="bulletins" className="mt-4">
            <Panel
              title="Bulletins"
              action={
                <Button size="sm" className="gap-2" onClick={handlePrintBulletin}>
                  <Printer className="size-4" /> Enprime Bulletin
                </Button>
              }
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Elèv</Label>
                  <Select value={bulletinStudentId} onValueChange={setBulletinStudentId}>
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
                <div className="space-y-1.5">
                  <Label>Peryòd</Label>
                  <Select value={bulletinPeriod} onValueChange={setBulletinPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tout peryòd" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!bulletinStudent ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Chwazi yon elèv pou wè apèsi bulletin lan.</p>
              ) : bulletinGrades.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Elèv sa a pa gen nòt pou peryòd sa a.</p>
              ) : (
                <div className="space-y-2">
                  {bulletinGrades.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                      <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{g.subject} · {g.period}</span>
                      <span className="gb-num font-semibold">{g.grade}/{g.max_grade}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="ore" className="mt-4">
            <Panel
              title="Emploi du temps"
              action={
                <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="size-4" /> Ajoute yon kou
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvo kou nan orè a</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Klas</Label>
                          <Input
                            value={scheduleForm.classroom}
                            onChange={(e) => setScheduleForm((f) => ({ ...f, classroom: e.target.value }))}
                            placeholder="Ex: 6e AF"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Matyè</Label>
                          <Select value={scheduleForm.subject} onValueChange={(v) => setScheduleForm((f) => ({ ...f, subject: v }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chwazi" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((s) => (
                                <SelectItem key={s.id} value={s.name}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Pwofesè</Label>
                        <Select
                          value={scheduleForm.teacher_name ?? ""}
                          onValueChange={(v) => setScheduleForm((f) => ({ ...f, teacher_name: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chwazi yon pwofesè" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.name}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Jou</Label>
                        <Select
                          value={String(scheduleForm.day_of_week)}
                          onValueChange={(v) => setScheduleForm((f) => ({ ...f, day_of_week: Number(v) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Lè kòmanse</Label>
                          <Input
                            type="time"
                            value={scheduleForm.start_time}
                            onChange={(e) => setScheduleForm((f) => ({ ...f, start_time: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Lè fini</Label>
                          <Input
                            type="time"
                            value={scheduleForm.end_time}
                            onChange={(e) => setScheduleForm((f) => ({ ...f, end_time: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => createScheduleMutation.mutate()} disabled={createScheduleMutation.isPending}>
                        {createScheduleMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                        Anrejistre
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              }
            >
              {scheduleQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Chajman...
                </div>
              ) : schedule.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Okenn kou nan orè a ankò.</p>
              ) : (
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((d) => {
                    const items = schedule.filter((s) => s.day_of_week === d.id);
                    if (items.length === 0) return null;
                    return (
                      <div key={d.id}>
                        <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">{d.label}</p>
                        <div className="space-y-1.5">
                          {items.map((s) => (
                            <div key={s.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                              <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                              <span className="gb-num text-xs text-muted-foreground">
                                {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {s.subject} · {s.classroom}
                                {s.teacher_name ? ` · ${s.teacher_name}` : ""}
                              </span>
                              <button type="button" onClick={() => setDeleteScheduleTarget(s.id)} className="text-destructive hover:opacity-70">
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="disiplin" className="mt-4">
            <Panel
              title="Discipline"
              action={
                <Dialog open={disciplineOpen} onOpenChange={setDisciplineOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="size-4" /> Nouvo ka
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvo ka disiplinè</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Elèv</Label>
                        <Select
                          value={disciplineForm.student_id}
                          onValueChange={(v) => setDisciplineForm((f) => ({ ...f, student_id: v }))}
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
                          <Label>Kategori</Label>
                          <Select
                            value={disciplineForm.category}
                            onValueChange={(v) => setDisciplineForm((f) => ({ ...f, category: v as DisciplineCategory }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DISCIPLINE_CATEGORIES.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Dat</Label>
                          <Input
                            type="date"
                            value={disciplineForm.occurred_on}
                            onChange={(e) => setDisciplineForm((f) => ({ ...f, occurred_on: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Deskripsyon</Label>
                        <Textarea
                          value={disciplineForm.description}
                          onChange={(e) => setDisciplineForm((f) => ({ ...f, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Aksyon pran (opsyonèl)</Label>
                        <Input
                          value={disciplineForm.action_taken ?? ""}
                          onChange={(e) => setDisciplineForm((f) => ({ ...f, action_taken: e.target.value || null }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => createDisciplineMutation.mutate()} disabled={createDisciplineMutation.isPending}>
                        {createDisciplineMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                        Anrejistre
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              }
            >
              {disciplineQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Chajman...
                </div>
              ) : disciplineRecords.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Okenn ka disiplinè anrejistre ankò.</p>
              ) : (
                <div className="space-y-2">
                  {disciplineRecords.map((r) => {
                    const st = students.find((s) => s.id === r.student_id);
                    return (
                      <div key={r.id} className="flex items-start gap-3 rounded-lg bg-secondary px-3 py-2.5 text-sm">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-kpi-red" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{st?.name ?? "Elèv"} <span className="text-xs font-normal text-muted-foreground">· {r.occurred_on}</span></p>
                          <p className="text-xs text-muted-foreground">{r.description}</p>
                          {r.action_taken ? <p className="text-xs italic text-muted-foreground">Aksyon: {r.action_taken}</p> : null}
                        </div>
                        <StatusPill tone={r.category === "ekspilsyon" ? "crit" : r.category === "sanksyon" ? "low" : "neutral"}>
                          {DISCIPLINE_CATEGORIES.find((c) => c.id === r.category)?.label ?? r.category}
                        </StatusPill>
                        <button type="button" onClick={() => setDeleteDisciplineTarget(r.id)} className="text-destructive hover:opacity-70">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="anons" className="mt-4">
            <Panel
              title="Annonces"
              action={
                <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="size-4" /> Nouvo anons
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvo anons</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Tit</Label>
                        <Input value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Mesaj</Label>
                        <Textarea value={announceBody} onChange={(e) => setAnnounceBody(e.target.value)} rows={4} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => createAnnouncementMutation.mutate()} disabled={createAnnouncementMutation.isPending}>
                        {createAnnouncementMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                        Pibliye
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              }
            >
              {announcementsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Chajman...
                </div>
              ) : announcements.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Okenn anons pibliye ankò.</p>
              ) : (
                <div className="space-y-2.5">
                  {announcements.map((a) => (
                    <div key={a.id} className="rounded-lg bg-secondary px-3 py-2.5 text-sm">
                      <div className="flex items-start gap-2">
                        <Bell className="mt-0.5 size-4 shrink-0 text-kpi-blue" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{a.title}</p>
                          <p className="text-muted-foreground">{a.body}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(a.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <button type="button" onClick={() => setDeleteAnnounceTarget(a)} className="text-destructive hover:opacity-70">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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

      <AlertDialog open={!!deleteSubjectTarget} onOpenChange={(v) => !v && setDeleteSubjectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase matyè sa a?</AlertDialogTitle>
            <AlertDialogDescription>Aksyon sa a pa ka anile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSubjectTarget && deleteSubjectMutation.mutate(deleteSubjectTarget.id)}
            >
              Efase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteScheduleTarget} onOpenChange={(v) => !v && setDeleteScheduleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase kou sa a nan orè a?</AlertDialogTitle>
            <AlertDialogDescription>Aksyon sa a pa ka anile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteScheduleTarget && deleteScheduleMutation.mutate(deleteScheduleTarget)}
            >
              Efase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDisciplineTarget} onOpenChange={(v) => !v && setDeleteDisciplineTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase ka sa a?</AlertDialogTitle>
            <AlertDialogDescription>Aksyon sa a pa ka anile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDisciplineTarget && deleteDisciplineMutation.mutate(deleteDisciplineTarget)}
            >
              Efase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAnnounceTarget} onOpenChange={(v) => !v && setDeleteAnnounceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase anons sa a?</AlertDialogTitle>
            <AlertDialogDescription>Aksyon sa a pa ka anile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteAnnounceTarget && deleteAnnouncementMutation.mutate(deleteAnnounceTarget.id)}
            >
              Efase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
