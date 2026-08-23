import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBiz } from "@/components/gboss/biz-context";
import { CHART_COLORS, KpiCard, PageHeader, Panel } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/gboss/data";
import { fetchWeekChart } from "@/lib/gboss/dashboard";
import { fetchInvoices, invoiceMetrics } from "@/lib/gboss/invoices";
import { fetchProducts, productStockMetrics } from "@/lib/gboss/products";
import { fetchTopProducts } from "@/lib/gboss/pos";

export const Route = createFileRoute("/app/rapo")({
  head: () => ({
    meta: [
      { title: "Rapports — G-Boss" },
      { name: "description", content: "Analyses des revenus, dépenses, profits, meilleures ventes et stock." },
      { property: "og:title", content: "Rapports — G-Boss" },
      { property: "og:description", content: "Analyses détaillées de votre performance commerciale." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { biz } = useBiz();

  const weekQuery = useQuery({ queryKey: ["week-chart", biz.id], queryFn: () => fetchWeekChart(biz.id) });
  const productsQuery = useQuery({ queryKey: ["products", biz.id], queryFn: () => fetchProducts(biz.id) });
  const invoicesQuery = useQuery({ queryKey: ["invoices", biz.id], queryFn: () => fetchInvoices(biz.id) });
  const topQuery = useQuery({ queryKey: ["top-products", biz.id], queryFn: () => fetchTopProducts(biz.id) });

  const week = weekQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const topSales = topQuery.data ?? [];

  const w = {
    revenue: week.reduce((s, d) => s + d.revenue, 0),
    expense: week.reduce((s, d) => s + d.expense, 0),
  };
  const profit = w.revenue - w.expense;
  const s = productStockMetrics(products);
  const inv = invoiceMetrics(invoices);
  const top = topSales
    .map((t) => ({ ...t, product: products.find((p) => p.id === t.productId) }))
    .filter((t) => t.product);

  const loading = weekQuery.isLoading || productsQuery.isLoading || invoicesQuery.isLoading || topQuery.isLoading;

  return (
    <div>
      <PageHeader
        title="Rapports"
        subtitle={`${biz.name} · 7 derniers jours`}
        actions={
          <Button size="sm" variant="outline" onClick={() => toast.info("Export PDF bientôt disponible")}>
            <Download className="size-4" /> Exporter PDF
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Chargement des rapports...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Revenus" value={money(w.revenue, biz.currency)} tone="green" />
            <KpiCard label="Dépenses" value={money(w.expense, biz.currency)} tone="orange" />
            <KpiCard label="Profit" value={money(profit, biz.currency)} tone="blue" hint={`marge ${Math.round((profit / Math.max(1, w.revenue)) * 100)}%`} />
            <KpiCard label="Facturé ce mois" value={money(inv.month, biz.currency)} tone="purple" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Revenus & dépenses par jour">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={week} margin={{ left: -18, right: 6, top: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" name="Revenus" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Dépenses" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Commandes par jour">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={week} margin={{ left: -18, right: 6, top: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="orders" stroke="var(--chart-5)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Top 5 produits vendus">
              {top.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucune vente pour l'instant.</p>
              ) : (
                <ul className="space-y-2.5">
                  {top.map((t, i) => (
                    <li key={t.productId} className="flex items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t.product?.name}</span>
                        <span className="gb-num text-xs text-muted-foreground">{t.qty} unités vendues</span>
                      </span>
                      <span className="gb-num text-sm font-semibold">{money(t.revenue, biz.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Répartition de la valeur du stock">
              {s.categories.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucun produit pour l'instant.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={s.categories} dataKey="value" nameKey="name" outerRadius={78}>
                        {s.categories.map((c, i) => (
                          <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
