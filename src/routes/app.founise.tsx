import { createFileRoute } from "@tanstack/react-router";
import { Plus, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/gboss/data";

export const Route = createFileRoute("/app/founise")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — G-Boss" },
      { name: "description", content: "Gérez vos fournisseurs, commandes en attente et évaluations." },
      { property: "og:title", content: "Fournisseurs — G-Boss" },
      { property: "og:description", content: "Suivi des achats, dettes fournisseurs et notes de fiabilité." },
    ],
  }),
  component: Suppliers,
});

function Suppliers() {
  const { biz } = useBiz();
  const list = biz.suppliers;
  const pending = list.reduce((s, x) => s + x.pending, 0);
  const purchases = list.reduce((s, x) => s + x.purchases, 0);
  const onGBoss = list.filter((x) => x.onGBoss).length;

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        subtitle={`${list.length} fournisseurs · ${biz.name}`}
        actions={
          <Button size="sm" onClick={() => toast.success("Nouveau fournisseur (démonstration)")}>
            <Plus className="size-4" /> Ajouter
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Fournisseurs actifs" value={String(list.filter((x) => x.active).length)} tone="blue" icon={<Truck className="size-4" />} />
        <KpiCard label="Sur G-Boss" value={String(onGBoss)} tone="purple" hint="commandes directes possibles" />
        <KpiCard label="À payer" value={money(pending, biz.currency)} tone="orange" />
        <KpiCard label="Achats cumulés" value={money(purchases, biz.currency)} tone="green" />
      </div>

      <Panel title="Liste des fournisseurs" className="mt-4">
        <div className="space-y-3">
          {list.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary font-display text-sm font-bold">
                {s.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="gb-num truncate text-xs text-muted-foreground">
                  {s.category} · {s.contact}
                </p>
              </div>
              <span className="gb-num flex items-center gap-1 text-xs font-semibold text-gold">
                <Star className="size-3.5 fill-gold" /> {s.rating.toFixed(1)}
              </span>
              <div className="text-right">
                <p className="gb-num text-sm font-semibold">{money(s.purchases, biz.currency)}</p>
                <p className="gb-num text-xs text-muted-foreground">
                  à payer {money(s.pending, biz.currency)}
                </p>
              </div>
              <StatusPill tone={s.active ? "ok" : "neutral"}>{s.active ? "Actif" : "Inactif"}</StatusPill>
              {s.onGBoss ? <StatusPill tone="low">Sur G-Boss</StatusPill> : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.success(`Commande envoyée à ${s.name} (démonstration)`)}
              >
                Commander
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
