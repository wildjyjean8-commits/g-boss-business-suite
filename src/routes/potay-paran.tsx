import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, CalendarCheck, KeyRound, Loader2, LogOut, Mail, Plus, Receipt, User } from "lucide-react";
import { GBossLogoDark } from "@/components/gboss/logo";
import { Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { money, FEE_CATEGORIES } from "@/lib/gboss/data";
import {
  fetchMyLinkedStudents,
  fetchStudentAttendance,
  fetchStudentGrades,
  fetchStudentPayments,
  linkGuardianByCode,
  type LinkedStudentRow,
  type PortalAttendanceRow,
  type PortalGradeRow,
  type PortalPaymentRow,
} from "@/lib/gboss/parent-portal";

export const Route = createFileRoute("/potay-paran")({
  head: () => ({ meta: [{ title: "Pòtay Paran/Elèv — G-Boss" }] }),
  component: ParentPortalPage,
});

function ParentPortalPage() {
  const [session, setSession] = useState<"loading" | "out" | "in">("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ? "in" : "out"));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ? "in" : "out"));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === "loading") {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Chajman...</div>;
  }

  return session === "in" ? <PortalDashboard /> : <PortalAuth />;
}

function PortalAuth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast.error("Antre yon email valab ak yon modpas 6+ karaktè.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erè koneksyon");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <GBossLogoDark />
        <div>
          <h2 className="max-w-md font-display text-3xl font-bold text-white">Pòtay Paran / Elèv</h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/70">
            Swiv nòt, prezans, ak peman eskolarite pitit ou dirèkteman soti nan lekòl la.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Ou pral bezwen kòd aksè lekòl la ba ou a.</p>
      </aside>

      <main className="flex items-center justify-center bg-background px-5 py-10">
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
          <div className="lg:hidden">
            <GBossLogoDark />
          </div>
          <div>
            <span className="grid size-11 place-items-center rounded-xl bg-card text-primary shadow-[var(--shadow-card)]">
              <Mail className="size-5" />
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold">
              {mode === "login" ? "Koneksyon" : "Kreye kont"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Pòtay Paran/Elèv G-Boss</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pp-email">Email</Label>
            <Input id="pp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ou@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp-password">Modpas</Label>
            <Input id="pp-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "login" ? "Konekte" : "Kreye kont"}
          </Button>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            className="w-full text-center text-sm font-medium text-primary hover:underline"
          >
            {mode === "login" ? "Premye fwa? Kreye yon kont" : "Ou gen yon kont deja? Konekte"}
          </button>
        </form>
      </main>
    </div>
  );
}

function PortalDashboard() {
  const [students, setStudents] = useState<LinkedStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [code, setCode] = useState("");
  const [role, setRole] = useState<"paran" | "elèv">("paran");
  const [linking, setLinking] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const rows = await fetchMyLinkedStudents();
      setStudents(rows);
      setActiveId((prev) => prev ?? rows[0]?.id ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erè chajman");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 6) {
      toast.error("Antre kòd 6 karaktè lekòl la ba ou a.");
      return;
    }
    setLinking(true);
    try {
      await linkGuardianByCode(code, role);
      toast.success("Timoun nan ajoute!");
      setLinkOpen(false);
      setCode("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kòd la pa valab");
    } finally {
      setLinking(false);
    }
  }

  const active = students.find((s) => s.id === activeId) ?? null;

  return (
    <div className="min-h-screen bg-[#F8F9FE]">
      <header className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
        <div className="scale-75 origin-left">
          <GBossLogoDark />
        </div>
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => supabase.auth.signOut()}>
          <LogOut className="size-4" /> Dekonekte
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">Timoun mwen yo</h1>
          <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" /> Ajoute yon timoun
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajoute yon timoun</DialogTitle>
                <DialogDescription>Antre kòd 6 karaktè lekòl la ba ou a.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLink} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Ou se</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as "paran" | "elèv")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paran">Paran/Titè</SelectItem>
                      <SelectItem value="elèv">Elèv la menm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pp-code">Kòd</Label>
                  <Input
                    id="pp-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center font-mono text-lg tracking-widest"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={linking} className="gap-2">
                    {linking ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                    Mare
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chajman...
          </div>
        ) : students.length === 0 ? (
          <Panel title="Okenn timoun mare ankò">
            <p className="py-6 text-center text-sm text-muted-foreground">
              Klike "Ajoute yon timoun" epi antre kòd lekòl la ba ou a pou wè nòt, prezans, ak peman.
            </p>
          </Panel>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeId === s.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            {active ? <StudentDetail student={active} /> : null}
          </>
        )}
      </main>
    </div>
  );
}

function StudentDetail({ student }: { student: LinkedStudentRow }) {
  const [grades, setGrades] = useState<PortalGradeRow[]>([]);
  const [attendance, setAttendance] = useState<PortalAttendanceRow[]>([]);
  const [payments, setPayments] = useState<PortalPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStudentGrades(student.id),
      fetchStudentAttendance(student.id),
      fetchStudentPayments(student.id),
    ])
      .then(([g, a, p]) => {
        setGrades(g);
        setAttendance(a);
        setPayments(p);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erè chajman"))
      .finally(() => setLoading(false));
  }, [student.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Chajman...
      </div>
    );
  }

  const presentCount = attendance.filter((a) => a.present).length;

  return (
    <div className="space-y-4">
      <Panel title={student.name}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Klas</p>
            <p className="font-semibold">{student.classroom ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mwayèn</p>
            <p className="font-semibold">{student.average != null ? `${student.average}/20` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Prezans</p>
            <p className="font-semibold">{student.attendance != null ? `${student.attendance}%` : "—"}</p>
            {student.attendance != null ? <ProgressBar value={student.attendance} tone="green" /> : null}
          </div>
        </div>
      </Panel>

      <Panel title="Nòt">
        {grades.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Okenn nòt anrejistre ankò.</p>
        ) : (
          <div className="space-y-2">
            {grades.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {g.subject} <span className="text-muted-foreground">· {g.period}</span>
                </span>
                <span className="gb-num font-semibold">{g.grade}/{g.max_grade}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Prezans (30 dènye jou)">
        {attendance.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Okenn prezans anrejistre ankò.</p>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">{presentCount}/{attendance.length} jou prezan</p>
            <div className="flex flex-wrap gap-1.5">
              {attendance.map((a) => (
                <span
                  key={a.id}
                  title={a.attended_on}
                  className={`grid size-8 place-items-center rounded-md text-xs font-medium ${
                    a.present ? "bg-kpi-green/15 text-kpi-green" : "bg-kpi-red/15 text-kpi-red"
                  }`}
                >
                  <CalendarCheck className="size-4" />
                </span>
              ))}
            </div>
          </>
        )}
      </Panel>

      <Panel title="Peman eskolarite">
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Okenn peman anrejistre ankò.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const catLabel = FEE_CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category;
              const balance = p.amount_due - p.amount_paid;
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                  <Receipt className="size-4 shrink-0 text-kpi-orange" />
                  <span className="min-w-0 flex-1 truncate">
                    {catLabel}
                    {p.label ? ` · ${p.label}` : ""}
                  </span>
                  <StatusPill tone={p.status === "paye" ? "ok" : p.status === "pasyèl" ? "low" : "crit"}>{p.status}</StatusPill>
                  <span className="gb-num font-semibold">
                    {money(p.amount_paid, "HTG")}
                    {balance > 0 ? <span className="ml-1 text-xs text-kpi-red">(rete {money(balance, "HTG")})</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
