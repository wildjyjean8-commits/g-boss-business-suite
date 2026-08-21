import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Apple,
  Building2,
  Check,
  CreditCard,
  GraduationCap,
  Hotel,
  Loader2,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";
import { GBossLogo } from "@/components/gboss/logo";
import { LangSwitcher } from "@/components/gboss/lang-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  HOTEL_ADDON_PRICE,
  MAX_BUSINESSES,
  PLANS,
  SECTORS,
  SECTOR_CATEGORIES,
  TRIAL_DAYS,
  VERIFICATION_CODE_MINUTES,
  planPrice,
  type PlanId,
} from "@/lib/gboss/data";

export const Route = createFileRoute("/enskripsyon")({
  head: () => ({
    meta: [
      { title: "Inscription — G-Boss" },
      {
        name: "description",
        content:
          "Créez votre compte G-Boss : type de compte, plan, infos business, vérification par code et paiement.",
      },
      { property: "og:title", content: "Inscription — G-Boss" },
      { property: "og:description", content: "8 jours d'essai gratuit sur G-Boss." },
    ],
  }),
  component: SignupPage,
});

const STEPS = ["Type de compte", "Choix du plan", "Info Business", "Vérification", "Paiement"];
const DRAFT_KEY = "gboss_signup_draft";

type AccountType = "biznis" | "institisyon";
type SchoolKind = "klasik" | "pwofesyonel";

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<AccountType>("biznis");
  const [schoolKind, setSchoolKind] = useState<SchoolKind>("klasik");
  const [plan, setPlan] = useState<PlanId>("estanda");
  const [businesses, setBusinesses] = useState(1);
  const [hotelAddon, setHotelAddon] = useState(false);
  const [students, setStudents] = useState(50);
  const [sector, setSector] = useState<string>("Restaurant");
  const [otherSector, setOtherSector] = useState("");
  const [bizName, setBizName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [posEnabled, setPosEnabled] = useState(true);
  const [stockEnabled, setStockEnabled] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [maxStepReached, setMaxStepReached] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      try {
        const draft = JSON.parse(raw) as {
          accountType?: string;
          schoolKind?: string;
          plan?: string;
          businesses?: number;
          hotelAddon?: boolean;
          students?: number;
          sector?: string;
          otherSector?: string;
          bizName?: string;
          phone?: string;
          posEnabled?: boolean;
          stockEnabled?: boolean;
        };
        if (typeof draft.accountType === "string") setAccountType(draft.accountType as AccountType);
        if (typeof draft.schoolKind === "string") setSchoolKind(draft.schoolKind as SchoolKind);
        if (typeof draft.plan === "string") setPlan(draft.plan as PlanId);
        if (typeof draft.businesses === "number") setBusinesses(draft.businesses);
        if (typeof draft.hotelAddon === "boolean") setHotelAddon(draft.hotelAddon);
        if (typeof draft.students === "number") setStudents(draft.students);
        if (typeof draft.sector === "string") setSector(draft.sector);
        if (typeof draft.otherSector === "string") setOtherSector(draft.otherSector);
        if (typeof draft.bizName === "string") setBizName(draft.bizName);
        if (typeof draft.phone === "string") setPhone(draft.phone);
        if (typeof draft.posEnabled === "boolean") setPosEnabled(draft.posEnabled);
        if (typeof draft.stockEnabled === "boolean") setStockEnabled(draft.stockEnabled);
        setEmail(data.session.user.email ?? "");
        setVerified(true);
        goToStep(4);
        toast.success("Connecté avec Google — vérifiez le récapitulatif avant de démarrer");
      } finally {
        sessionStorage.removeItem(DRAFT_KEY);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveDraftForOAuth() {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        accountType,
        schoolKind,
        plan,
        businesses,
        hotelAddon,
        students,
        sector,
        otherSector,
        bizName,
        phone,
        posEnabled,
        stockEnabled,
      }),
    );
  }

  const effectiveSector = sector === "Autre" ? otherSector || "Autre" : sector;
  const effectivePlan: PlanId = accountType === "institisyon" ? "kanpis" : plan;
  const price = useMemo(
    () => planPrice(effectivePlan, businesses, hotelAddon, students),
    [effectivePlan, businesses, hotelAddon, students],
  );
  const presetCategories = SECTOR_CATEGORIES[sector] ?? SECTOR_CATEGORIES["Autre"]!;

  function goToStep(s: number) {
    setStep(s);
    setMaxStepReached((m) => Math.max(m, s));
  }

  async function next() {
    if (step === 2) {
      if (!bizName.trim() || !email.includes("@")) {
        toast.error("Nom du business et email valides requis");
        return;
      }
      if (password.length < 6) {
        toast.error("Mot de passe : 6 caractères minimum");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Les mots de passe ne correspondent pas");
        return;
      }

      setSendingCode(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              biz_name: bizName.trim(),
              phone: phone.trim() || null,
              sector: effectiveSector,
              account_type: accountType,
              plan: effectivePlan,
            },
          },
        });

        if (error) {
          toast.error(
            error.message === "User already registered"
              ? "Un compte existe déjà avec cet email — connectez-vous plutôt"
              : error.message,
          );
          return;
        }

        toast.success(`Code envoyé à ${email} — valable ${VERIFICATION_CODE_MINUTES} minutes`);
        goToStep(3);
      } catch (err) {
        console.error("[enskripsyon] signUp failed", err);
        toast.error("Impossible de contacter le serveur — vérifiez votre connexion et réessayez");
      } finally {
        setSendingCode(false);
      }
      return;
    }

    if (step === 3) {
      if (!verified) {
        toast.error("Entrez le code reçu par email avant de continuer");
        return;
      }
    }

    goToStep(Math.min(STEPS.length - 1, step + 1));
  }

  async function verifyCode() {
    if (code.length !== 6) {
      toast.error("Le code fait 6 chiffres");
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "signup",
      });

      if (error || !data.session) {
        toast.error(
          error?.message === "Token has expired or is invalid"
            ? "Code incorrect ou expiré"
            : error?.message ?? "Erreur de vérification",
        );
        return;
      }

      setVerified(true);
      toast.success("Email vérifié !");
      goToStep(4);
    } catch (err) {
      console.error("[enskripsyon] verifyOtp failed", err);
      toast.error("Impossible de contacter le serveur — vérifiez votre connexion et réessayez");
    } finally {
      setVerifying(false);
    }
  }

  async function finishSignup() {
    setFinishing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        toast.error("Session expirée — recommencez la vérification");
        goToStep(3);
        return;
      }

      const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("businesses").insert({
        owner_id: userId,
        name: bizName.trim(),
        sector: effectiveSector,
        plan: effectivePlan,
        pos_enabled: posEnabled,
        stock_enabled: stockEnabled,
        hotel_addon: hotelAddon,
        status: "trial",
        trial_ends_at: trialEndsAt,
        phone: phone.trim() || null,
        email: email.trim(),
      });

      if (error) {
        toast.error(`Erreur création business : ${error.message}`);
        return;
      }

      toast.success(`Bienvenue ! ${TRIAL_DAYS} jours d'essai gratuit ont commencé.`);
      navigate({ to: "/app" });
    } catch (err) {
      console.error("[enskripsyon] finishSignup failed", err);
      toast.error("Impossible de contacter le serveur — vérifiez votre connexion et réessayez");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="bg-sidebar p-6">
        <GBossLogo />
        <ol className="mt-8 space-y-1">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                onClick={() => i <= maxStepReached && setStep(i)}
                disabled={i > maxStepReached}
                className={cn(
                  i > maxStepReached && "cursor-not-allowed opacity-50",
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  i === step
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent",
                )}
              >
                <span
                  className={cn(
                    "gb-num grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    i < step ? "bg-gold text-[#00113c]" : "bg-sidebar-accent text-white",
                  )}
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-8 rounded-xl border border-sidebar-border bg-sidebar-accent p-4">
          <p className="gb-label text-sidebar-foreground/60">Total mensuel</p>
          <p className="gb-num mt-1 text-2xl font-bold text-white">{price} HTG</p>
          <p className="mt-1 text-[11px] text-sidebar-foreground/60">
            {TRIAL_DAYS} jours d'essai gratuit d'abord
          </p>
        </div>
        <div className="mt-6">
          <LangSwitcher variant="dark" />
        </div>
      </aside>

      <main className="bg-background px-5 py-8 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="gb-label">
            Étape {step + 1} / {STEPS.length}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold">{STEPS[step]}</h1>

          <div className="mt-6 space-y-4">
            {step === 0 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    icon={<Store className="size-5" />}
                    title="Biznis"
                    text="Entreprise, boutique, restaurant, service."
                    active={accountType === "biznis"}
                    onClick={() => setAccountType("biznis")}
                  />
                  <ChoiceCard
                    icon={<GraduationCap className="size-5" />}
                    title="Institisyon"
                    text="École primaire, secondaire, université, formation."
                    active={accountType === "institisyon"}
                    onClick={() => setAccountType("institisyon")}
                  />
                </div>
                {accountType === "institisyon" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ChoiceCard
                      title="Lekòl Klasik"
                      text="Primaire / secondaire / université."
                      active={schoolKind === "klasik"}
                      onClick={() => setSchoolKind("klasik")}
                    />
                    <ChoiceCard
                      title="Lekòl Pwofesyonèl"
                      text="Formation technique et vocationnelle."
                      active={schoolKind === "pwofesyonel"}
                      onClick={() => setSchoolKind("pwofesyonel")}
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            {step === 1 ? (
              <>
                {accountType === "biznis" ? (
                  <div className="grid gap-3">
                    {(["esansyel", "estanda", "premyom"] as const).map((id) => (
                      <ChoiceCard
                        key={id}
                        title={`${PLANS[id].name} — ${PLANS[id].price} HTG/mois`}
                        text={
                          id === "esansyel"
                            ? "1 personne · dashboard, tâches, rapports, facture, stock."
                            : id === "estanda"
                              ? "2 à 5 employés · chat interne, audio/vidéo, permissions."
                              : "Jusqu'à 20 personnes · canaux par département, admin multi-niveaux."
                        }
                        active={plan === id}
                        onClick={() => setPlan(id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="gb-card space-y-3 p-4">
                    <p className="font-display font-semibold">G-Kanpis — 75 HTG/mois par élève</p>
                    <Label htmlFor="students">Nombre d'élèves</Label>
                    <Input
                      id="students"
                      className="gb-num"
                      type="number"
                      min={1}
                      value={students}
                      onChange={(e) => setStudents(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                )}

                <div className="gb-card space-y-4 p-4">
                  <Row
                    title={`Gérer 2 business sous ce compte (max ${MAX_BUSINESSES})`}
                    text="Données strictement séparées · +30% sur le plan choisi"
                    checked={businesses === 2}
                    onChange={(v) => setBusinesses(v ? 2 : 1)}
                  />
                  <Row
                    icon={<Hotel className="size-4" />}
                    title={`Add-on « Airbnb and Hotel » — ${HOTEL_ADDON_PRICE} HTG/mois`}
                    text="Unités, check-in/check-out, fiche client, rôles limités."
                    checked={hotelAddon}
                    onChange={setHotelAddon}
                  />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <div className="gb-card space-y-4 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bizName">Nom du business / institution</Label>
                  <Input id="bizName" value={bizName} onChange={(e) => setBizName(e.target.value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="mail">Email</Label>
                    <Input id="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tel">Téléphone (SMS/WhatsApp)</Label>
                    <Input id="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd">Mot de passe</Label>
                    <Input
                      id="pwd"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6 caractères minimum"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd2">Confirmer le mot de passe</Label>
                    <Input
                      id="pwd2"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Secteur d'activité</Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sector === "Autre" ? (
                    <Input
                      placeholder="Précisez votre secteur"
                      value={otherSector}
                      onChange={(e) => setOtherSector(e.target.value)}
                    />
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Catégories de stock pré-remplies (modifiables ensuite) :{" "}
                    {presetCategories.join(", ")}
                  </p>
                </div>

                <div className="space-y-3 border-t border-border pt-3">
                  <Row
                    title="Vle itilize Kès/Vant pou bay kliyan resi ?"
                    text="Active le module Caisse/Vente (POS) avec taxe configurable et export PDF/JPEG/Impression."
                    checked={posEnabled}
                    onChange={setPosEnabled}
                  />
                  <Row
                    title="Gen envantè/estòk pwodwi pou jere ?"
                    text="Active le module Stock complet (SKU, scan code-barres, mouvements)."
                    checked={stockEnabled}
                    onChange={setStockEnabled}
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="gb-card space-y-4 p-5">
                {verified ? <Check className="size-8 text-kpi-green" /> : <ShieldCheck className="size-8 text-kpi-green" />}
                <h2 className="font-display text-lg font-semibold">
                  {verified ? "Email vérifié" : "Code envoyé par email"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Saisissez le code à 6 chiffres envoyé à {email || "votre email"}. Valable{" "}
                  {VERIFICATION_CODE_MINUTES} minutes.
                </p>
                <Input
                  className="gb-num max-w-xs text-center text-lg tracking-[0.4em]"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  disabled={verified}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={verifyCode} disabled={verifying || verified || code.length !== 6}>
                    {verifying ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    {verified ? "Vérifié" : "Vérifier le code"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={sendingCode}
                    onClick={async () => {
                      setSendingCode(true);
                      const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
                      setSendingCode(false);
                      if (error) toast.error(error.message);
                      else toast.success("Nouveau code envoyé");
                    }}
                  >
                    Renvoyer le code
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button variant="outline" disabled onClick={() => toast.info("Sign in with Apple")}>
                    <Apple className="size-4" /> Apple
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      saveDraftForOAuth();
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: { redirectTo: `${window.location.origin}/enskripsyon` },
                      });
                      if (error) toast.error(error.message);
                    }}
                  >
                    <Mail className="size-4" /> Google
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="gb-card space-y-4 p-5">
                <h2 className="font-display text-lg font-semibold">Récapitulatif & paiement</h2>
                <dl className="divide-y divide-border text-sm">
                  <SummaryRow label="Type de compte" value={accountType === "biznis" ? "Biznis" : `Institisyon (${schoolKind === "klasik" ? "Lekòl Klasik" : "Lekòl Pwofesyonèl"})`} />
                  <SummaryRow label="Plan" value={PLANS[effectivePlan].name} />
                  <SummaryRow label="Business gérés" value={`${businesses} ${businesses > 1 ? "(+30%)" : ""}`} />
                  <SummaryRow label="Add-on Airbnb & Hôtel" value={hotelAddon ? `Oui (${HOTEL_ADDON_PRICE} HTG)` : "Non"} />
                  <SummaryRow label="Secteur" value={effectiveSector} />
                  <SummaryRow label="Kès/Vant" value={posEnabled ? "Oui" : "Non"} />
                  <SummaryRow label="Stock" value={stockEnabled ? "Oui" : "Non"} />
                  <SummaryRow label="Total mensuel" value={`${price} HTG`} />
                </dl>
                <p className="rounded-lg bg-status-ok px-3 py-2 text-xs font-medium text-kpi-green">
                  {TRIAL_DAYS} jours d'essai gratuit — aucun paiement requis maintenant. Rappels aux
                  jours 5, 7 et 8 par notification interne + SMS/WhatsApp. Le paiement MonCash sera
                  demandé avant la fin de l'essai (à activer prochainement).
                </p>
                <Button className="w-full" onClick={finishSignup} disabled={finishing || !verified}>
                  {finishing ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  Démarrer mon essai gratuit
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Retour
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={sendingCode}>
                {sendingCode ? <Loader2 className="size-4 animate-spin" /> : null}
                Continuer
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/login">
                  <Building2 className="size-4" /> J'ai déjà un compte
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  text,
  active,
  onClick,
}: {
  icon?: React.ReactNode;
  title: string;
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "gb-card p-4 text-left transition-all",
        active ? "ring-2 ring-primary" : "hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-2">
        {icon ? <span className="text-primary">{icon}</span> : null}
        <span className="font-display font-semibold">{title}</span>
        {active ? <Check className="ml-auto size-4 text-kpi-green" /> : null}
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </button>
  );
}

function Row({
  icon,
  title,
  text,
  checked,
  onChange,
}: {
  icon?: React.ReactNode;
  title: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {icon} {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="gb-num font-semibold">{value}</dd>
    </div>
  );
}
