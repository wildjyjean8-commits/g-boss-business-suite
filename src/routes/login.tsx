import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Apple, KeyRound, Loader2, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { GBossLogoDark } from "@/components/gboss/logo";
import { LangSwitcher } from "@/components/gboss/lang-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPER_ADMIN_EMAIL, VERIFICATION_CODE_MINUTES } from "@/lib/gboss/data";

export const Route = createFileRoute("/login")({
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

type Step = "credentials" | "code" | "sa-password" | "sa-2fa";

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const isSuperAdmin = email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Email invalide");
      return;
    }
    setBusy(true);
    // Le même formulaire sert à tous les comptes : le flag Super-Admin en base
    // décide de la redirection et du parcours de sécurité.
    setTimeout(() => {
      setBusy(false);
      if (isSuperAdmin) {
        setStep(password.length >= 8 ? "sa-2fa" : "sa-password");
        return;
      }
      if (password.length < 6) {
        toast.error("Mot de passe trop court");
        return;
      }
      setStep("code");
      toast.success(`Code envoyé par email — valable ${VERIFICATION_CODE_MINUTES} minutes`);
    }, 500);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold text-white">G-BOSS</span>
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

          {step === "credentials" ? (
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

              {isSuperAdmin ? (
                <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
                  Compte Super-Admin détecté : configuration du mot de passe et 2FA par application
                  Authenticator au premier accès.
                </p>
              ) : null}

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
                  onClick={() => toast.info("Sign in with Apple — à activer avec le fournisseur d'auth")}
                >
                  <Apple className="size-4" /> Continuer avec Apple
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.info("Sign in with Google — à activer avec le fournisseur d'auth")}
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
          ) : null}

          {step === "code" ? (
            <div className="mt-8 space-y-4">
              <h1 className="font-display text-2xl font-bold">Vérification par code</h1>
              <p className="text-sm text-muted-foreground">
                Saisissez le code à 6 chiffres envoyé à {email}. Valable{" "}
                {VERIFICATION_CODE_MINUTES} minutes.
              </p>
              <Input
                className="gb-num text-center text-lg tracking-[0.4em]"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
              <Button
                className="w-full"
                disabled={code.length !== 6}
                onClick={() => navigate({ to: "/app" })}
              >
                Valider et entrer
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("credentials")}>
                Retour
              </Button>
            </div>
          ) : null}

          {step === "sa-password" ? (
            <div className="mt-8 space-y-4">
              <h1 className="font-display text-2xl font-bold">Créer votre mot de passe</h1>
              <p className="text-sm text-muted-foreground">
                Premier accès Super-Admin : définissez un mot de passe de 8 caractères minimum.
              </p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
              />
              <Button
                className="w-full"
                disabled={password.length < 8}
                onClick={() => setStep("sa-2fa")}
              >
                Continuer
              </Button>
            </div>
          ) : null}

          {step === "sa-2fa" ? (
            <div className="mt-8 space-y-4">
              <h1 className="font-display text-2xl font-bold">2FA obligatoire</h1>
              <p className="text-sm text-muted-foreground">
                Scannez la clé dans votre application Authenticator (Google Authenticator, Authy).
                La 2FA par SMS n'est pas autorisée pour ce compte.
              </p>
              <div className="gb-card grid place-items-center gap-2 p-6 text-center">
                <Smartphone className="size-8 text-kpi-purple" />
                <p className="gb-num text-sm font-semibold">JBSW Y3DP EHPK 3PXP</p>
                <p className="text-xs text-muted-foreground">Clé de configuration TOTP</p>
              </div>
              <Input
                className="gb-num text-center tracking-[0.4em]"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
              <Button
                className="w-full"
                disabled={code.length !== 6}
                onClick={() => navigate({ to: "/superadmin" })}
              >
                <ShieldCheck className="size-4" /> Activer et ouvrir le dashboard
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
