import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Apple, KeyRound, Loader2, Mail } from "lucide-react";
import { GBossLogoDark } from "@/components/gboss/logo";
import { LangSwitcher } from "@/components/gboss/lang-switcher";
import loginPanel from "@/assets/login-panel.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [
      { title: "Connexion — G-Boss" },
      { name: "description", content: "Connectez-vous à G-Boss : email/mot de passe, Apple ou Google." },
      { property: "og:title", content: "Connexion — G-Boss" },
      { property: "og:description", content: "Accédez à votre espace de gestion G-Boss." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Email invalide");
      return;
    }
    if (password.length < 6) {
      toast.error("Mot de passe trop court");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (error || !data.session) {
      toast.error(error?.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect"
        : error?.message ?? "Erreur de connexion");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", data.session.user.id)
      .single();

    toast.success("Connexion réussie");

    if (profile?.is_super_admin) {
      navigate({ to: "/superadmin" });
      return;
    }

    navigate({ to: redirectTo && redirectTo.startsWith("/app") ? redirectTo : "/app" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar lg:flex">
        <img
          src={loginPanel}
          alt="G-Boss — Gérer. Organiser. Développer. Tableau de bord intelligent, gestion de stock, gestion d'équipe, rapports et analyses."
          className="absolute inset-0 size-full object-cover"
        />
        <div className="relative flex justify-end p-6">
          <LangSwitcher variant="dark" />
        </div>
        <p className="relative px-10 pb-8 text-xs text-sidebar-foreground/60">
          Sessions Super-Admin : déconnexion automatique après 30 min d'inactivité.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <GBossLogoDark />
          </div>

          <form onSubmit={submitCredentials} className="mt-8 space-y-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Connexion</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Un seul formulaire pour tous les comptes.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@business.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Se connecter
            </Button>

            <div className="relative py-1 text-center">
              <span className="gb-label bg-background px-2">ou</span>
            </div>

            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                disabled
                onClick={() => toast.info("Sign in with Apple — retiré temporairement")}
              >
                <Apple className="size-4" /> Continuer avec Apple
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${window.location.origin}/app` },
                  });
                  if (error) toast.error(error.message);
                }}
              >
                <Mail className="size-4" /> Continuer avec Google
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Pas de compte ?{" "}
              <Link to="/enskripsyon" className="font-semibold text-primary">
                Inscription
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
