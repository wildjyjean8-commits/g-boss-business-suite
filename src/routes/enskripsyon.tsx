import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Apple,
  Building2,
  Check,
  CreditCard,
  GraduationCap,
  Hotel,
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
  const [code, setCode] = useState("");

  const effectiveSector = sector === "Autre" ? otherSector || "Autre" : sector;
  const effectivePlan: PlanId = accountType === "institisyon" ? "kanpis" : plan;
  const price = useMemo(
    () => planPrice(effectivePlan, businesses, hotelAddon, students),
    [effectivePlan, businesses, hotelAddon, students],
  );
  const presetCategories = SECTOR_CATEGORIES[sector] ?? SECTOR_CATEGORIES["Autre"]!;

  function next() {
    if (step === 2) {
      if (!bizName.trim() || !email.includes("@")) {
        toast.error("Nom du business et email valides requis");
        return;
      }
      toast.success(`Code envoyé à ${email} — valable ${VERIFICATION_CODE_MINUTES} minutes`);
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="bg-sidebar p-6">
        <GBossLogo />
        <ol className="mt-8 space-y-1">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                onClick={() => setStep(i)}
                className={cn(
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
                <ShieldCheck className="size-8 text-kpi-green" />
                <h2 className="font-display text-lg font-semibold">Code envoyé par email</h2>
                <p className="text-sm text-muted-foreground">
                  Saisissez le code à 6 chiffres envoyé à {email || "votre email"}. Valable{" "}
                  {VERIFICATION_CODE_MINUTES} minutes. Les comptes créés via Apple ou Google sautent
                  cette étape.
                </p>
                <Input
                  className="gb-num max-w-xs text-center text-lg tracking-[0.4em]"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => toast.info("Sign in with Apple")}>
                    <Apple className="size-4" /> Apple
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Sign in with Google")}>
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
                  {TRIAL_DAYS} jours d'essai gratuit. Rappels aux jours 5, 7 et 8 par notification
                  interne + SMS/WhatsApp.
                </p>
                <Button className="w-full" onClick={() => navigate({ to: "/app" })}>
                  <CreditCard className="size-4" /> Payer par MonCash et ouvrir mon espace
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
              <Button onClick={next}>Continuer</Button>
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
