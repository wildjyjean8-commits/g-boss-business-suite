import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { money, weekMetrics } from "@/lib/gboss/data";

export const Route = createFileRoute("/app/kes")({
  head: () => ({
    meta: [
      { title: "Caisse / Vente — G-Boss" },
      { name: "description", content: "Point de vente rapide : panier, total avec taxe et impression du reçu thermique." },
      { property: "og:title", content: "Caisse / Vente — G-Boss" },
      { property: "og:description", content: "Encaissez vite et imprimez le reçu 58 / 80 mm." },
    ],
  }),
  component: Pos,
});

function Pos() {
  const { biz } = useBiz();
  const w = weekMetrics(biz);
  const [cart, setCart] = useState<Record<string, number>>({});

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: biz.products.find((p) => p.id === id)!, qty }))
        .filter((l) => l.product),
    [cart, biz.products],
  );
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const tax = subtotal * (biz.taxRate / 100);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const remove = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      const q = (next[id] ?? 0) - 1;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });

  if (!biz.posEnabled) {
    return (
      <div>
        <PageHeader title="Caisse / Vente" subtitle={biz.name} />
        <Panel title="Module non activé">
          <p className="text-sm text-muted-foreground">
            La caisse n'est pas activée pour ce business. Activez-la dans Paramètres.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Caisse / Vente" subtitle={`${biz.name} · taxe ${biz.taxRate}%`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Ventes de la semaine" value={money(w.revenue, biz.currency)} tone="green" />
        <KpiCard label="Commandes" value={String(w.orders)} tone="blue" />
        <KpiCard label="Panier moyen" value={money(w.revenue / Math.max(1, w.orders), biz.currency)} tone="purple" />
        <KpiCard label="Taux de change" value={`1 USD = ${biz.rate} HTG`} tone="orange" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Produits" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {biz.products.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                disabled={p.stock <= 0}
                className="rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-accent disabled:opacity-50"
              >
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="gb-num mt-1 text-sm text-accent">{money(p.price, biz.currency)}</p>
                <p className="gb-num text-xs text-muted-foreground">stock {p.stock}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Panier"
          action={
            lines.length ? (
              <button onClick={() => setCart({})} className="text-xs font-semibold text-kpi-red">
                <Trash2 className="inline size-3.5" /> Vider
              </button>
            ) : null
          }
        >
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sélectionnez des produits pour commencer la vente.</p>
          ) : (
            <ul className="space-y-2">
              {lines.map((l) => (
                <li key={l.product.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{l.product.name}</span>
                    <span className="gb-num text-xs text-muted-foreground">
                      {money(l.product.price * l.qty, biz.currency)}
                    </span>
                  </span>
                  <Button variant="outline" size="icon" className="size-7" onClick={() => remove(l.product.id)}>
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="gb-num w-6 text-center text-sm">{l.qty}</span>
                  <Button variant="outline" size="icon" className="size-7" onClick={() => add(l.product.id)}>
                    <Plus className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <p className="flex justify-between text-muted-foreground">
              <span>Sous-total</span>
              <span className="gb-num">{money(subtotal, biz.currency)}</span>
            </p>
            <p className="flex justify-between text-muted-foreground">
              <span>Taxe {biz.taxRate}%</span>
              <span className="gb-num">{money(tax, biz.currency)}</span>
            </p>
            <p className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="gb-num">{money(subtotal + tax, biz.currency)}</span>
            </p>
          </div>

          <Button
            className="mt-3 w-full"
            disabled={!lines.length}
            onClick={() => {
              setCart({});
              toast.success("Vente encaissée · reçu envoyé à l'imprimante");
            }}
          >
            <Printer className="size-4" /> Encaisser & imprimer
          </Button>
        </Panel>
      </div>
    </div>
  );
}
