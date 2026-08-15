import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBiz } from "@/components/gboss/biz-context";
import { CHART_COLORS, KpiCard, Panel, PageHeader, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/gboss/i18n";
import {
  invoiceMetrics,
  money,
  stockMetrics,
  stockStatus,
  taskMetrics,
  weekMetrics,
} from "@/lib/gboss/data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — G-Boss" },
      {
        name: "description",
        content: "Vue d'ensemble : revenus, dépenses, profit, stock critique, tâches et factures.",
      },
      { property: "og:title", content: "Tableau de bord — G-Boss" },
      { property: "og:description", content: "Revenus, dépenses, profit, stock et tâches en un coup d'œil." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { biz } = useBiz();
  const w = weekMetrics(biz);
  const s = stockMetrics(biz);
  const inv = invoiceMetrics(biz);
  const tk = taskMetrics(biz);
  const doneRate = Math.round((tk.done.length / Math.max(1, tk.total)) * 100);

  return (
    <div>
      <PageHeader
        title={t("dashboard")}
        subtitle={`${biz.name} · ${biz.sector}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/app/faktirasyon">Nouvelle facture</Link>
            </Button>
            {biz.posEnabled ? (
              <Button asChild size="sm">
                <Link to="/app/kes">Ouvrir la caisse</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t("revenue")} value={money(w.revenue, biz.currency)} tone="green" delta="Semaine en cours" icon={<TrendingUp className="size-4" />} />
        <KpiCard label={t("expenses")} value={money(w.expense, biz.currency)} tone="orange" icon={<Wallet className="size-4" />} />
        <KpiCard label={t("profit")} value={money(w.profit, biz.currency)} tone="blue" hint={`${w.orders} commandes`} icon={<ShoppingCart className="size-4" />} />
        <KpiCard label="Valeur du stock" value={money(s.value, biz.currency)} tone="purple" hint={`${s.total} produits`} icon={<Package className="size-4" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Revenus vs dépenses (7 jours)" className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biz.week} margin={{ left: -18, right: 6, top: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Stock par catégorie">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={s.categories} dataKey="value" nameKey="name" innerRadius={38} outerRadius={64} paddingAngle={2}>
                  {s.categories.map((c, i) => (
                    <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {s.categories.map((c, i) => (
              <li key={c.name} className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                <span className="gb-num font-medium">{money(c.value, biz.currency)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          title="Alertes stock"
          action={
            <Link to="/app/estok" className="text-xs font-semibold text-accent">
              Voir tout
            </Link>
          }
        >
          {s.low.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte — tous les niveaux sont bons.</p>
          ) : (
            <ul className="space-y-2.5">
              {s.low.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-kpi-orange" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="gb-num text-xs text-muted-foreground">
                      {p.stock} / min {p.min}
                    </span>
                  </span>
                  <StatusPill tone={stockStatus(p)}>{stockStatus(p) === "crit" ? "Critique" : "Bas"}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Factures récentes"
          action={
            <Link to="/app/faktirasyon" className="text-xs font-semibold text-accent">
              Voir tout
            </Link>
          }
        >
          <ul className="space-y-2.5">
            {biz.invoices.slice(0, 4).map((i) => (
              <li key={i.id} className="flex items-center gap-2">
                <FileText className="size-4 shrink-0 text-kpi-blue" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{i.client}</span>
                  <span className="gb-num text-xs text-muted-foreground">
                    {i.id} · {i.date}
                  </span>
                </span>
                <span className="gb-num text-sm font-semibold">{money(i.amount, biz.currency)}</span>
              </li>
            ))}
          </ul>
          <p className="gb-num mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            En attente : {money(inv.pending, biz.currency)} · Expiré : {money(inv.expired, biz.currency)}
          </p>
        </Panel>

        <Panel
          title="Avancement des tâches"
          action={
            <Link to="/app/tach" className="text-xs font-semibold text-accent">
              Kanban
            </Link>
          }
        >
          <div className="flex items-center gap-2 text-sm">
            <ClipboardList className="size-4 text-kpi-purple" />
            <span className="gb-num font-semibold">{doneRate}%</span>
            <span className="text-muted-foreground">terminées</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={doneRate} tone="purple" />
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <li>À faire : {tk.todo.length}</li>
            <li>En cours : {tk.doing.length}</li>
            <li>Bloquées : {tk.blocked.length}</li>
            <li>Non assignées : {tk.unassigned}</li>
          </ul>
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <Users className="size-4 text-kpi-green" />
            {biz.employees.filter((e) => e.present).length} / {biz.employees.length} présents aujourd'hui
          </div>
        </Panel>
      </div>
    </div>
  );
}
