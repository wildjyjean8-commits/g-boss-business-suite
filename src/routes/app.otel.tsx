import { createFileRoute } from "@tanstack/react-router";
import { BedDouble, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { HOTEL_ADDON_PRICE, money } from "@/lib/gboss/data";

export const Route = createFileRoute("/app/otel")({
  head: () => ({
    meta: [
      { title: "Airbnb / Hôtel — G-Boss" },
      { name: "description", content: "Gérez chambres, studios et appartements : disponibilité, tarifs et occupation." },
      { property: "og:title", content: "Airbnb / Hôtel — G-Boss" },
      { property: "og:description", content: "Module locatif : unités, capacités, équipements et tarifs par nuit." },
    ],
  }),
  component: Hotel,
});

const STATUS = {
  libre: { tone: "ok" as const, label: "Libre" },
  occupe: { tone: "crit" as const, label: "Occupé" },
  nettoyage: { tone: "low" as const, label: "Nettoyage" },
};

function Hotel() {
  const { biz } = useBiz();
  const units = biz.units;
  const occupied = units.filter((u) => u.status === "occupe").length;
  const potential = units.reduce((s, u) => s + u.pricePerNight, 0);
  const capacity = units.reduce((s, u) => s + u.capacity, 0);

  return (
    <div>
      <PageHeader
        title="Airbnb / Hôtel"
        subtitle={`Add-on locatif · ${money(HOTEL_ADDON_PRICE, "HTG")}/mois · ${units.length} unités`}
        actions={
          <Button size="sm" onClick={() => toast.success("Unité ajoutée (démonstration)")}>
            <Plus className="size-4" /> Ajouter une unité
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Unités" value={String(units.length)} tone="blue" icon={<BedDouble className="size-4" />} />
        <KpiCard
          label="Taux d'occupation"
          value={`${Math.round((occupied / Math.max(1, units.length)) * 100)}%`}
          tone="purple"
        />
        <KpiCard label="Capacité totale" value={`${capacity} personnes`} tone="green" />
        <KpiCard label="Revenu potentiel / nuit" value={money(potential, biz.currency)} tone="orange" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {units.length === 0 ? (
          <Panel title="Unités" className="lg:col-span-3">
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucune unité pour ce business. Activez l'add-on et ajoutez vos chambres.
            </p>
          </Panel>
        ) : (
          units.map((u) => (
            <article key={u.id} className="gb-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-semibold">{u.label}</h3>
                  <p className="gb-num text-xs text-muted-foreground">
                    {u.number} · {u.type}
                  </p>
                </div>
                <StatusPill tone={STATUS[u.status].tone}>{STATUS[u.status].label}</StatusPill>
              </div>

              <ul className="gb-num mt-3 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                <li>{u.bedrooms} chambre(s)</li>
                <li>{u.bathrooms} salle(s) de bain</li>
                <li>{u.livingRoom ? "Salon" : "Sans salon"}</li>
                <li>{u.kitchen ? "Cuisine" : "Sans cuisine"}</li>
                <li>Capacité {u.capacity}</li>
              </ul>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium">
                    {a}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="gb-num text-sm font-semibold">
                  {money(u.pricePerNight, biz.currency)}
                  <span className="text-xs font-normal text-muted-foreground"> / nuit</span>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={u.status === "occupe"}
                  onClick={() => toast.success(`Réservation créée pour ${u.label} (démonstration)`)}
                >
                  Réserver
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
