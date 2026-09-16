import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { GBossLogoDark } from "@/components/gboss/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { linkTeamMemberByCode } from "@/lib/gboss/members";

export const Route = createFileRoute("/koneksyon-ekip")({
  head: () => ({
    meta: [{ title: "Koneksyon Ekip — G-Boss" }],
  }),
  component: TeamLoginPage,
});

function TeamLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState("");
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
      setAuthed(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erè koneksyon");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaimCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 6) {
      toast.error("Antre kòd 6 karaktè patwon ou ba ou a.");
      return;
    }
    setBusy(true);
    try {
      await linkTeamMemberByCode(code);
      toast.success("Kont ou mare — n ap voye ou nan espas travay la");
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kòd la pa valab");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <GBossLogoDark />
        <div>
          <h2 className="max-w-md font-display text-3xl font-bold text-white">Espas Ekip</h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/70">
            Konekte ak pwòp kont ou, epi antre kòd patwon ou ba ou a pou jwenn aksè a biznis/institisyon an.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Aksè limite selon wòl ou.</p>
      </aside>

      <main className="flex items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <GBossLogoDark />
          </div>

          {!authed ? (
            <form onSubmit={handleAuth} className="mt-8 space-y-4">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-card text-primary shadow-[var(--shadow-card)]">
                  <Mail className="size-5" />
                </span>
                <h1 className="mt-3 font-display text-2xl font-bold">
                  {mode === "login" ? "Koneksyon Ekip" : "Kreye kont Ekip"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "login" ? "Konekte ak kont ou deja genyen an." : "Premye fwa? Kreye yon kont."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="te-email">Email</Label>
                <Input
                  id="te-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ou@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="te-password">Modpas</Label>
                <Input
                  id="te-password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
          ) : (
            <form onSubmit={handleClaimCode} className="mt-8 space-y-4">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-card text-primary shadow-[var(--shadow-card)]">
                  <KeyRound className="size-5" />
                </span>
                <h1 className="mt-3 font-display text-2xl font-bold">Kòd aksè</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Antre kòd 6 karaktè patwon/direktè ou ba ou a (nan paj Ekip li).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="te-code">Kòd</Label>
                <Input
                  id="te-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: A1B2C3"
                  maxLength={6}
                  className="text-center font-mono text-lg tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Mare kont mwen
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
