import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Coins, Globe, Loader2, Percent, Plus, Receipt, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, KpiCard, StatusPill } from "@/components/gboss/ui";
import { useBiz } from "@/components/gboss/biz-context";
import { useI18n } from "@/lib/gboss/i18n";
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
import { updateBusinessSettings } from "@/lib/gboss/business-settings";
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

function Settings() {
  const { biz, businesses, refreshBusinesses } = useBiz();
  const { lang, setLang, t } = useI18n();

  const [currency, setCurrency] = useState<"HTG" | "USD">(biz.currency);
  const [rate, setRate] = useState(String(biz.rate));
  const [taxRate, setTaxRate] = useState(String(biz.taxRate));
  const [plan, setPlan] = useState<PlanId>(biz.plan);
  const [hotelAddon, setHotelAddon] = useState(biz.hotelAddon);
  const [students, setStudents] = useState(String(biz.students.length || 0));
  const [saving, setSaving] = useState(false);

  const studentCount = Number(students) || 0;
  const total = planPrice(plan, businesses.length, hotelAddon, studentCount);
  const base = plan === "kanpis" ? PLANS.kanpis.price * studentCount : PLANS[plan].price;

  async function handleSave() {
    setSaving(true);
    try {
      await updateBusinessSettings(biz.id, {
        currency,
        exchange_rate: Number(rate) || biz.rate,
        tax_rate: Number(taxRate) || 0,
        plan,
        hotel_addon: hotelAddon,
      });
      await refreshBusinesses();
      toast.success("Paramètres enregistrés");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan anrejistreman an");
    } finally {
      setSaving(false);
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
        <KpiCard label="Abonnement mensuel" value={money(total, "HTG")} tone="purple" icon={<Receipt className="size-4" />} hint={PLANS[plan].name} />
        <KpiCard label="Business actifs" value={`${businesses.length} / ${MAX_BUSINESSES}`} tone="blue" icon={<Building2 className="size-4" />} hint={`Surcharge +${MULTI_BUSINESS_SURCHARGE * 100}% dès le 2e`} />
        <KpiCard label="Essai gratuit" value={`${TRIAL_DAYS} jours`} tone="green" icon={<Sparkles className="size-4" />} hint="Notifications SMS / WhatsApp" />
        <KpiCard label="Mode hors-ligne" value={`${OFFLINE_GRACE_DAYS} jours`} tone="orange" icon={<Globe className="size-4" />} hint="Synchronisation au retour du réseau" />
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
                <Label htmlFor="rate" className="gb-label">Taux 1 USD = ? HTG</Label>
                <Input id="rate" className="gb-num mt-2" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label htmlFor="tax" className="gb-label">Taxe (%)</Label>
                <Input id="tax" className="gb-num mt-2" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
              <Coins className="mr-1 inline size-3.5" />
              Exemple : {money(1000, "HTG")} ≈{" "}
              <span className="gb-num">
                {(1000 / (Number(rate) || 1)).toFixed(2)} USD
              </span>{" "}
              · taxe appliquée {Number(taxRate) || 0}% ={" "}
              <span className="gb-num">{money(1000 * (1 + (Number(taxRate) || 0) / 100), "HTG")}</span>
            </p>
          </div>
        </Panel>

        <Panel title="Langue de l'interface">
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "fr", label: "Français" },
              { id: "ht", label: "Kreyòl" },
              { id: "en", label: "English" },
              { id: "es", label: "Español" },
            ] as const).map((l) => (
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

        <Panel title="Plan & add-ons">
          <div className="space-y-2">
            {(Object.keys(PLANS) as PlanId[]).map((id) => (
              <button
                key={id}
                onClick={() => setPlan(id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  plan === id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{PLANS[id].name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {PLANS[id].seats > 0 ? `${PLANS[id].seats} utilisateurs` : "Facturé par élève"}
                  </span>
                </span>
                <span className="gb-num shrink-0 text-sm font-semibold">
                  {PLANS[id].price} <span className="text-xs text-muted-foreground">{PLANS[id].unit}</span>
                </span>
              </button>
            ))}
          </div>

          {plan === "kanpis" ? (
            <div className="mt-3">
              <Label htmlFor="students" className="gb-label">Nombre d'élèves</Label>
              <Input id="students" className="gb-num mt-2" value={students} onChange={(e) => setStudents(e.target.value)} inputMode="numeric" />
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
            <div className="flex justify-between"><dt className="text-muted-foreground">Base</dt><dd className="gb-num">{money(base, "HTG")}</dd></div>
            {businesses.length > 1 ? (
              <div className="flex justify-between"><dt className="text-muted-foreground">2e business (+30%)</dt><dd className="gb-num">{money(base * MULTI_BUSINESS_SURCHARGE, "HTG")}</dd></div>
            ) : null}
            {hotelAddon ? (
              <div className="flex justify-between"><dt className="text-muted-foreground">Add-on hôtel</dt><dd className="gb-num">{money(HOTEL_ADDON_PRICE, "HTG")}</dd></div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-1 font-semibold"><dt>Total</dt><dd className="gb-num">{money(total, "HTG")}</dd></div>
          </dl>
        </Panel>

        <Panel title={`Mes business (max ${MAX_BUSINESSES})`}>
          <div className="space-y-2">
            {businesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.sector} · {PLANS[b.plan].name} · {b.currency}
                  </p>
                </div>
                {b.id === biz.id ? <StatusPill tone="ok">Actif</StatusPill> : <StatusPill tone="neutral">Séparé</StatusPill>}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-3 w-full gap-2"
            disabled={businesses.length >= MAX_BUSINESSES}
          >
            <Plus className="size-4" />
            {businesses.length >= MAX_BUSINESSES ? "Limite de 2 business atteinte" : "Ajouter un business (+30%)"}
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
