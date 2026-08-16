import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
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
import { invoiceMetrics, money, stockMetrics, weekMetrics } from "@/lib/gboss/data";

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
  const w = weekMetrics(biz);
  const s = stockMetrics(biz);
  const inv = invoiceMetrics(biz);
  const top = [...biz.products].sort((a, b) => b.sold - a.sold).slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Rapports"
        subtitle={`${biz.name} · 7 derniers jours`}
        actions={
          <Button size="sm" variant="outline" onClick={() => toast.success("Rapport exporté en PDF (démonstration)")}>
            <Download className="size-4" /> Exporter PDF
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Revenus" value={money(w.revenue, biz.currency)} tone="green" />
        <KpiCard label="Dépenses" value={money(w.expense, biz.currency)} tone="orange" />
        <KpiCard label="Profit" value={money(w.profit, biz.currency)} tone="blue" hint={`marge ${Math.round((w.profit / Math.max(1, w.revenue)) * 100)}%`} />
        <KpiCard label="Facturé ce mois" value={money(inv.month, biz.currency)} tone="purple" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Revenus & dépenses par jour">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={biz.week} margin={{ left: -18, right: 6, top: 6 }}>
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
              <LineChart data={biz.week} margin={{ left: -18, right: 6, top: 6 }}>
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
          <ul className="space-y-2.5">
            {top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="gb-num text-xs text-muted-foreground">{p.sold} unités vendues</span>
                </span>
                <span className="gb-num text-sm font-semibold">{money(p.sold * p.price, biz.currency)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Répartition de la valeur du stock">
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
        </Panel>
      </div>
    </div>
  );
}
