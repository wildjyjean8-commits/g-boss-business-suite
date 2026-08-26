import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Coins,
  FileCheck2,
  Globe,
  ImageUp,
  Loader2,
  Percent,
  Plus,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, KpiCard, StatusPill } from "@/components/gboss/ui";
import { VerifiedBadge } from "@/components/gboss/kyc-badge";
import { useBiz } from "@/components/gboss/biz-context";
import { useSession } from "@/lib/gboss/use-session";
import { useI18n } from "@/lib/gboss/i18n";
import { supabase } from "@/integrations/supabase/client";
import { createSubscriptionPayment } from "@/lib/moncash/actions";
import {
  fetchLatestKycSubmission,
  submitKyc,
  type KycDocumentType,
  type KycSubmission,
} from "@/lib/gboss/kyc";
import {
  HOTEL_ADDON_PRICE,
  MAX_BUSINESSES,
  MULTI_BUSINESS_SURCHARGE,
  OFFLINE_GRACE_DAYS,
  PLANS,
  TRIAL_DAYS,
  money,
  planPrice,
  type PlanId,
} from "@/lib/gboss/data";
import {
  updateBusinessSettings,
  updateBusinessProfile,
  uploadBusinessLogo,
} from "@/lib/gboss/business-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/paramet")({
  head: () => ({
    meta: [
      { title: "Paramètres — G-Boss" },
      {
        name: "description",
        content:
          "Réglez devise, taux de change, taxe, langue, plan d'abonnement, add-on hôtel et gestion de vos business G-Boss.",
      },
      { property: "og:title", content: "Paramètres — G-Boss" },
      {
        property: "og:description",
        content: "Devise, taux de change, taxe, langue, plan et add-ons de votre compte G-Boss.",
      },
    ],
  }),
  component: Settings,
});

function KycPanel() {
  const { biz, refreshBusinesses } = useBiz();
  const { session } = useSession();
  const [submission, setSubmission] = useState<KycSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<KycDocumentType>("cin");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchLatestKycSubmission(biz.id).then((s) => {
      if (active) {
        setSubmission(s);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [biz.id]);

  async function handleSubmit() {
    if (!idFile || !selfieFile || !session) return;
    setSubmitting(true);
    try {
      await submitKyc(biz.id, session.user.id, docType, idFile, selfieFile);
      const latest = await fetchLatestKycSubmission(biz.id);
      setSubmission(latest);
      await refreshBusinesses();
      toast.success("Demand KYC ou a soumèt — n ap revize l talè");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erè pandan soumisyon KYC la");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !loading && (!submission || submission.status === "rejected");

  return (
    <Panel title="Verifikasyon KYC" className="lg:col-span-2">
      {biz.kycStatus === "approved" ? (
        <div className="flex items-center gap-2 rounded-lg bg-status-ok p-3 text-sm font-medium text-kpi-green">
          <VerifiedBadge />
          Biznis ou verifye — mèsi!
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Soumèt kat idantite ou (CIN oswa Paspò) ansanm ak yon selfie pou verifye biznis ou. Sa
            ajoute yon "check" verifikasyon devan non biznis ou. Pa gen okenn blokaj aksè pandan w
            ap tann revizyon an.
          </p>

          {submission && submission.status !== "not_submitted" ? (
            <div
              className={cn(
                "mb-3 flex items-center gap-2 rounded-lg p-3 text-sm font-medium",
                submission.status === "pending" && "bg-kpi-blue/10 text-kpi-blue",
                submission.status === "rejected" && "bg-status-crit text-kpi-red",
              )}
            >
              {submission.status === "pending" ? (
                <FileCheck2 className="size-4 shrink-0" />
              ) : (
                <AlertTriangle className="size-4 shrink-0" />
              )}
              {submission.status === "pending"
                ? "Demand ou an atant revizyon Super-Admin."
                : `Demand rejte : ${submission.rejectionReason ?? "okenn rezon bay"} — ou ka soumèt ankò.`}
            </div>
          ) : null}

          {canSubmit ? (
            <div className="space-y-3">
              <div>
                <Label className="gb-label">Tip dokiman</Label>
                <div className="mt-2 flex gap-2">
                  {(
                    [
                      { id: "cin", label: "Kat Idantite (CIN)" },
                      { id: "paspò", label: "Paspò" },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDocType(d.id)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                        docType === d.id
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-accent/50",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="kycIdDoc" className="gb-label">
                    Foto dokiman idantite
                  </Label>
                  <Input
                    id="kycIdDoc"
                    type="file"
                    accept="image/*"
                    className="mt-2"
                    onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div>
                  <Label htmlFor="kycSelfie" className="gb-label">
                    Selfie
                  </Label>
                  <Input
                    id="kycSelfie"
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="mt-2"
                    onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!idFile || !selfieFile || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileCheck2 className="size-4" />
                )}
                Soumèt pou verifikasyon
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}

function Settings() {
  const { biz, businesses, refreshBusinesses } = useBiz();
  const { lang, setLang, t } = useI18n();

  const [currency, setCurrency] = useState<"HTG" | "USD">(biz.currency);
  const [rate, setRate] = useState(String(biz.rate));
  const [taxRate, setTaxRate] = useState(String(biz.taxRate));
  const [plan, setPlan] = useState<PlanId>(biz.plan);
  const [hotelAddon, setHotelAddon] = useState(biz.hotelAddon);
  const [posEnabled, setPosEnabled] = useState(biz.posEnabled);
  const [stockEnabled, setStockEnabled] = useState(biz.stockEnabled);
  const [students, setStudents] = useState(String(biz.students.length || 0));
  const [saving, setSaving] = useState(false);

  const [legalName, setLegalName] = useState(biz.legalName ?? "");
  const [address, setAddress] = useState(biz.address ?? "");
  const [phone, setPhone] = useState(biz.phone ?? "");
  const [email, setEmail] = useState(biz.email ?? "");
  const [taxNumber, setTaxNumber] = useState(biz.taxNumber ?? "");
  const [logoUrl, setLogoUrl] = useState(biz.logoUrl);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const studentCount = Number(students) || 0;
  const total = planPrice(plan, businesses.length, hotelAddon, studentCount);
  const base = plan === "kanpis" ? PLANS.kanpis.price * studentCount : PLANS[plan].price;
  const [payingMoncash, setPayingMoncash] = useState(false);

  async function handlePayMoncash() {
    setPayingMoncash(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sesyon ekspire — rekonekte epi eseye ankò.");

      const result = await createSubscriptionPayment({
        data: { businessId: biz.id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      window.location.href = result.redirectUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erè pandan kreyasyon peman MonCash la");
      setPayingMoncash(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateBusinessSettings(biz.id, {
        currency,
        exchange_rate: Number(rate) || biz.rate,
        tax_rate: Number(taxRate) || 0,
        plan,
        hotel_addon: hotelAddon,
        pos_enabled: posEnabled,
        stock_enabled: stockEnabled,
      });
      await refreshBusinesses();
      toast.success("Paramètres enregistrés");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan anrejistreman an");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await updateBusinessProfile(biz.id, {
        legal_name: legalName.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        tax_number: taxNumber.trim() || null,
      });
      await refreshBusinesses();
      toast.success("Infos entreprise enregistrées");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan anrejistreman an");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo la twò gwo (maksimòm 2 Mo)");
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadBusinessLogo(biz.id, file);
      setLogoUrl(url);
      await refreshBusinesses();
      toast.success("Logo mete ajou");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan upload logo a");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  return (
    <div>
      <PageHeader
        title={t("settings")}
        subtitle={`${biz.name} · ${biz.sector}`}
        actions={
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Enregistrer
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Abonnement mensuel"
          value={money(total, "HTG")}
          tone="purple"
          icon={<Receipt className="size-4" />}
          hint={PLANS[plan].name}
        />
        <KpiCard
          label="Business actifs"
          value={`${businesses.length} / ${MAX_BUSINESSES}`}
          tone="blue"
          icon={<Building2 className="size-4" />}
          hint={`Surcharge +${MULTI_BUSINESS_SURCHARGE * 100}% dès le 2e`}
        />
        <KpiCard
          label="Essai gratuit"
          value={`${TRIAL_DAYS} jours`}
          tone="green"
          icon={<Sparkles className="size-4" />}
          hint="Notifications SMS / WhatsApp"
        />
        <KpiCard
          label="Mode hors-ligne"
          value={`${OFFLINE_GRACE_DAYS} jours`}
          tone="orange"
          icon={<Globe className="size-4" />}
          hint="Synchronisation au retour du réseau"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Devise & taxe">
          <div className="space-y-4">
            <div>
              <Label className="gb-label">Devise principale</Label>
              <div className="mt-2 flex gap-2">
                {(["HTG", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                      currency === c
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-accent/50",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="rate" className="gb-label">
                  Taux 1 USD = ? HTG
                </Label>
                <Input
                  id="rate"
                  className="gb-num mt-2"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div>
                <Label htmlFor="tax" className="gb-label">
                  Taxe (%)
                </Label>
                <Input
                  id="tax"
                  className="gb-num mt-2"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>
            <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
              <Coins className="mr-1 inline size-3.5" />
              Exemple : {money(1000, "HTG")} ≈{" "}
              <span className="gb-num">{(1000 / (Number(rate) || 1)).toFixed(2)} USD</span> · taxe
              appliquée {Number(taxRate) || 0}% ={" "}
              <span className="gb-num">
                {money(1000 * (1 + (Number(taxRate) || 0) / 100), "HTG")}
              </span>
            </p>
          </div>
        </Panel>

        <Panel
          title="Infos entreprise"
          className="lg:col-span-2"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          }
        >
          <p className="mb-3 text-xs text-muted-foreground">
            Ces infos apparaissent sur vos reçus et factures imprimés (logo, adresse, téléphone,
            NIF).
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="grid size-20 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="size-full object-contain" />
                ) : (
                  <ImageUp className="size-6 text-muted-foreground" />
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {logoUrl ? "Changer" : "Ajouter un logo"}
              </Button>
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="legalName" className="gb-label">
                  Nom légal (optionnel)
                </Label>
                <Input
                  id="legalName"
                  className="mt-2"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder={biz.name}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address" className="gb-label">
                  Adresse
                </Label>
                <Input
                  id="address"
                  className="mt-2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ri, katye, vil"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="gb-label">
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  className="mt-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+509 ..."
                />
              </div>
              <div>
                <Label htmlFor="bizEmail" className="gb-label">
                  Email
                </Label>
                <Input
                  id="bizEmail"
                  className="mt-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kontak@biznis.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="taxNumber" className="gb-label">
                  NIF / Numéro fiscal
                </Label>
                <Input
                  id="taxNumber"
                  className="mt-2"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Panel>

        <KycPanel />

        <Panel title="Langue de l'interface">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "fr", label: "Français" },
                { id: "ht", label: "Kreyòl" },
                { id: "en", label: "English" },
                { id: "es", label: "Español" },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                  lang === l.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-accent/50",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            La langue s'applique immédiatement à toute la navigation.
          </p>
        </Panel>

        <Panel title="Modules activés">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Kès / Vant (point de vente)</p>
                <p className="text-xs text-muted-foreground">
                  Encaisser et donner un reçu au client
                </p>
              </div>
              <Switch checked={posEnabled} onCheckedChange={setPosEnabled} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Stock / Inventaire détaillé</p>
                <p className="text-xs text-muted-foreground">Suivi SKU, alertes de stock minimum</p>
              </div>
              <Switch checked={stockEnabled} onCheckedChange={setStockEnabled} />
            </div>
          </div>
        </Panel>

        <Panel title="Plan & add-ons">
          <div className="space-y-2">
            {(Object.keys(PLANS) as PlanId[]).map((id) => (
              <button
                key={id}
                onClick={() => setPlan(id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  plan === id
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/40",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{PLANS[id].name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {PLANS[id].seats > 0 ? `${PLANS[id].seats} utilisateurs` : "Facturé par élève"}
                  </span>
                </span>
                <span className="gb-num shrink-0 text-sm font-semibold">
                  {PLANS[id].price}{" "}
                  <span className="text-xs text-muted-foreground">{PLANS[id].unit}</span>
                </span>
              </button>
            ))}
          </div>

          {plan === "kanpis" ? (
            <div className="mt-3">
              <Label htmlFor="students" className="gb-label">
                Nombre d'élèves
              </Label>
              <Input
                id="students"
                className="gb-num mt-2"
                value={students}
                onChange={(e) => setStudents(e.target.value)}
                inputMode="numeric"
              />
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Add-on Airbnb / Hôtel</p>
              <p className="gb-num text-xs text-muted-foreground">+{HOTEL_ADDON_PRICE} HTG/mois</p>
            </div>
            <Switch checked={hotelAddon} onCheckedChange={setHotelAddon} />
          </div>

          <dl className="mt-3 space-y-1 rounded-lg bg-secondary p-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Base</dt>
              <dd className="gb-num">{money(base, "HTG")}</dd>
            </div>
            {businesses.length > 1 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">2e business (+30%)</dt>
                <dd className="gb-num">{money(base * MULTI_BUSINESS_SURCHARGE, "HTG")}</dd>
              </div>
            ) : null}
            {hotelAddon ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Add-on hôtel</dt>
                <dd className="gb-num">{money(HOTEL_ADDON_PRICE, "HTG")}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <dt>Total</dt>
              <dd className="gb-num">{money(total, "HTG")}</dd>
            </div>
          </dl>

          <Button
            onClick={handlePayMoncash}
            disabled={payingMoncash || total <= 0}
            className="mt-3 w-full gap-2 bg-[#DA291C] text-white hover:bg-[#DA291C]/90"
          >
            {payingMoncash ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wallet className="size-4" />
            )}
            Peye ak MonCash
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {biz.subscriptionPaidUntil
              ? `Peye jiska ${new Date(biz.subscriptionPaidUntil).toLocaleDateString("fr-HT")}`
              : "Ou pral redirije sou MonCash pou konplete peman an"}
          </p>
        </Panel>

        <Panel title={`Mes business (max ${MAX_BUSINESSES})`}>
          <div className="space-y-2">
            {businesses.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.sector} · {PLANS[b.plan].name} · {b.currency}
                  </p>
                </div>
                {b.id === biz.id ? (
                  <StatusPill tone="ok">Actif</StatusPill>
                ) : (
                  <StatusPill tone="neutral">Séparé</StatusPill>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-3 w-full gap-2"
            disabled={businesses.length >= MAX_BUSINESSES}
          >
            <Plus className="size-4" />
            {businesses.length >= MAX_BUSINESSES
              ? "Limite de 2 business atteinte"
              : "Ajouter un business (+30%)"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            <Percent className="mr-1 inline size-3.5" />
            Les données de chaque business restent strictement séparées.
          </p>
        </Panel>
      </div>
    </div>
  );
}
