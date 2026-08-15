import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money, stockMetrics, stockStatus, SECTOR_CATEGORIES } from "@/lib/gboss/data";

export const Route = createFileRoute("/app/estok")({
  head: () => ({
    meta: [
      { title: "Stock & Market — G-Boss" },
      { name: "description", content: "Suivez vos produits, niveaux minimum, alertes et valeur de stock par catégorie." },
      { property: "og:title", content: "Stock & Market — G-Boss" },
      { property: "og:description", content: "Produits, alertes de rupture et valeur du stock." },
    ],
  }),
  component: Stock,
});

function Stock() {
  const { biz } = useBiz();
  const m = stockMetrics(biz);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const categories = SECTOR_CATEGORIES[biz.sector] ?? m.categories.map((c) => c.name);

  const rows = useMemo(
    () =>
      biz.products.filter(
        (p) =>
          (!cat || p.category === cat) &&
          (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())),
      ),
    [biz.products, cat, q],
  );

  return (
    <div>
      <PageHeader
        title="Stock / Market"
        subtitle={`Catégories pré-remplies selon le secteur : ${biz.sector}`}
        actions={
          <Button size="sm" onClick={() => toast.success("Produit ajouté (démonstration)")}>
            <Plus className="size-4" /> Ajouter un produit
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Valeur (coût)" value={money(m.value, biz.currency)} tone="blue" />
        <KpiCard label="Valeur (vente)" value={money(m.retail, biz.currency)} tone="green" />
        <KpiCard label="Unités en stock" value={String(m.units)} tone="purple" hint={`${m.total} produits`} />
        <KpiCard label="Alertes" value={String(m.low.length)} tone={m.low.length ? "red" : "green"} hint="sous le minimum" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher produit ou SKU" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={cat === null ? "default" : "outline"} size="sm" onClick={() => setCat(null)}>
            Toutes
          </Button>
          {categories.map((c) => (
            <Button key={c} variant={cat === c ? "default" : "outline"} size="sm" onClick={() => setCat(c)}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      <Panel title={`Produits (${rows.length})`} className="mt-4">
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="gb-label py-2">SKU</th>
                <th className="gb-label py-2">Produit</th>
                <th className="gb-label py-2">Catégorie</th>
                <th className="gb-label py-2 text-right">Prix</th>
                <th className="gb-label py-2 text-right">Stock</th>
                <th className="gb-label py-2">Niveau</th>
                <th className="gb-label py-2 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = stockStatus(p);
                return (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="gb-num py-2.5 text-muted-foreground">{p.sku}</td>
                    <td className="py-2.5 font-medium">{p.name}</td>
                    <td className="py-2.5 text-muted-foreground">{p.category}</td>
                    <td className="gb-num py-2.5 text-right">{money(p.price, biz.currency)}</td>
                    <td className="gb-num py-2.5 text-right font-semibold">{p.stock}</td>
                    <td className="w-32 py-2.5">
                      <ProgressBar
                        value={(p.stock / Math.max(1, p.min * 2)) * 100}
                        tone={st === "ok" ? "green" : st === "low" ? "orange" : "red"}
                      />
                    </td>
                    <td className="py-2.5 text-right">
                      <StatusPill tone={st}>{st === "ok" ? "OK" : st === "low" ? "Bas" : "Critique"}</StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
