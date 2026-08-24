import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Apple, Eye, EyeOff, KeyRound, Lock, Loader2, ShieldCheck } from "lucide-react";
import { GBossLogoDark } from "@/components/gboss/logo";
import { LangSwitcher } from "@/components/gboss/lang-switcher";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

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

  async function handleForgotPassword() {
    if (!email.includes("@")) {
      toast.error("Antre email ou anvan");
      return;
    }
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    setSendingReset(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Yon lyen reyinisyalizasyon voye nan email ou");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center justify-between">
          <GBossLogoDark />
          <LangSwitcher variant="dark" />
        </div>
        <div>
          <h2 className="max-w-md font-display text-3xl font-bold text-white">
            Gérer. Organiser. Développer.
          </h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/70">
            Une seule connexion pour vos business, votre équipe, votre stock et vos rapports.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
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
              <span className="grid size-11 place-items-center rounded-xl bg-card text-primary shadow-[var(--shadow-card)]">
                <Lock className="size-5" />
              </span>
              <h1 className="mt-3 font-display text-2xl font-bold">Connexion</h1>
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Cache mo de pas la" : "Montre mo de pas la"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} />
                Se souvenir de moi
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={sendingReset}
                className="font-medium text-primary hover:underline disabled:opacity-50"
              >
                {sendingReset ? "Voye..." : "Mot de passe oublié ?"}
              </button>
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
                <GoogleIcon className="size-4" /> Continuer avec Google
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Pas de compte ?{" "}
              <Link to="/enskripsyon" className="font-semibold text-primary">
                Inscription
              </Link>
            </p>

            <p className="flex items-center justify-center gap-1.5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0" />
              Vos données sont protégées avec un chiffrement de niveau entreprise.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l6-6C33.9 6.5 29.2 4.5 24 4.5 12.9 4.5 4 13.4 4 24.5S12.9 44.5 24 44.5c11.4 0 21-8.2 21-20.5 0-1.2-.1-2.4-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c2.8 0 5.3 1 7.3 2.7l6-6C33.9 6.5 29.2 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.5c5.1 0 9.8-2 13.3-5.1l-6.2-5.2c-2 1.4-4.5 2.3-7.1 2.3-5.3 0-9.7-2.6-11.3-7l-6.5 5c3.4 6.7 10.4 10 17.8 10Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l.1-.1 6.2 5.2c-.4.4 6.7-4.9 6.7-15.1 0-1.2-.1-2.4-.4-3.5Z"
      />
    </svg>
  );
}
