import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GBossLogo } from "@/components/gboss/logo";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import {
  PLANS,
  PLATFORM_ACCOUNTS,
  PLATFORM_GROWTH,
  accountMRR,
  money,
  type PlanId,
} from "@/lib/gboss/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin")({
  beforeLoad: async ({ location }) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", sessionData.session.user.id)
      .single();

    if (profileError || !profile?.is_super_admin) {
      throw redirect({ to: "/app" });
    }

    return { session: sessionData.session };
  },
  head: () => ({
    meta: [
      { title: "Super-Admin — Pilotage plateforme G-Boss" },
      {
        name: "description",
        content:
          "Console Super-Admin G-Boss : revenus récurrents, comptes abonnés, répartition des plans et croissance de la plateforme.",
      },
      { property: "og:title", content: "Super-Admin — Pilotage plateforme G-Boss" },
      {
        property: "og:description",
        content: "Revenus récurrents, comptes abonnés et croissance de la plateforme G-Boss.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuperAdmin,
});

const STATUS_TONE = {
  actif: "ok",
  essai: "low",
  restreint: "crit",
  annule: "neutral",
} as const;

const STATUS_LABEL = {
  actif: "Actif",
  essai: "Essai",
  restreint: "Restreint",
  annule: "Annulé",
} as const;

function SuperAdmin() {
  const { session } = Route.useRouteContext();
  const [filter, setFilter] = useState<"tous" | keyof typeof STATUS_LABEL>("tous");

  const metrics = useMemo(() => {
    const active = PLATFORM_ACCOUNTS.filter((a) => a.status === "actif");
    const mrr = active.reduce((s, a) => s + accountMRR(a), 0);
    const trials = PLATFORM_ACCOUNTS.filter((a) => a.status === "essai");
    const late = PLATFORM_ACCOUNTS.filter((a) => !a.paidOnTime);
    const students = PLATFORM_ACCOUNTS.reduce((s, a) => s + a.students, 0);
    const businesses = PLATFORM_ACCOUNTS.reduce((s, a) => s + a.businesses, 0);
    const byPlan = (Object.keys(PLANS) as PlanId[]).map((id) => ({
      plan: PLANS[id].name,
      comptes: PLATFORM_ACCOUNTS.filter((a) => a.plan === id).length,
      revenu: PLATFORM_ACCOUNTS.filter((a) => a.plan === id).reduce((s, a) => s + accountMRR(a), 0),
    }));
    return { active, mrr, trials, late, students, businesses, byPlan };
  }, []);

  const rows = PLATFORM_ACCOUNTS.filter((a) => filter === "tous" || a.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3">
        <GBossLogo />
        <Button asChild variant="ghost" size="sm" className="ml-auto gap-2 text-white hover:bg-sidebar-accent hover:text-white">
          <Link to="/app">
            <ArrowLeft className="size-4" /> App
          </Link>
        </Button>
      </header>

      <main className="p-4 lg:p-6">
        <PageHeader
          title="Console Super-Admin"
          subtitle={`Connecté : ${session.user.email} · pilotage global de la plateforme G-Boss`}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Revenu récurrent (MRR)"
            value={money(metrics.mrr, "HTG")}
            tone="green"
            delta={`+${Math.round(((PLATFORM_GROWTH.at(-1)!.revenue / PLATFORM_GROWTH.at(-2)!.revenue) - 1) * 100)}% vs mois passé`}
            icon={<DollarSign className="size-4" />}
          />
          <KpiCard
            label="Comptes abonnés"
            value={String(PLATFORM_ACCOUNTS.length)}
            tone="blue"
            hint={`${metrics.active.length} actifs · ${metrics.trials.length} en essai`}
            icon={<Users className="size-4" />}
          />
          <KpiCard
            label="Business gérés"
            value={String(metrics.businesses)}
            tone="purple"
            hint="Max 2 par compte (+30%)"
            icon={<Building2 className="size-4" />}
          />
          <KpiCard
            label="Élèves G-Kanpis"
            value={String(metrics.students)}
            tone="orange"
            hint={`${PLANS.kanpis.price} HTG / élève / mois`}
            icon={<GraduationCap className="size-4" />}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Croissance de la plateforme">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PLATFORM_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenu HTG"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="accounts"
                    name="Comptes"
                    stroke="var(--chart-3)"
                    fill="var(--chart-3)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Revenu par plan">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.byPlan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="plan" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenu" name="Revenu HTG" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {metrics.byPlan.map((p) => (
                <li key={p.plan} className="flex justify-between">
                  <span>{p.plan}</span>
                  <span className="gb-num">
                    {p.comptes} comptes · {money(p.revenu, "HTG")}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          className="mt-4"
          title="Comptes de la plateforme"
          action={
            <div className="flex flex-wrap gap-1">
              {(["tous", "actif", "essai", "restreint", "annule"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                    filter === f ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {f === "tous" ? "Tous" : STATUS_LABEL[f]}
                </button>
              ))}
            </div>
          }
        >
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="gb-label py-2">Compte</th>
                  <th className="gb-label py-2">Plan</th>
                  <th className="gb-label py-2">Business</th>
                  <th className="gb-label py-2">Inscrit</th>
                  <th className="gb-label py-2 text-right">MRR</th>
                  <th className="gb-label py-2 text-right">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5">
                      <p className="font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.id} · {a.sector}
                      </p>
                    </td>
                    <td className="py-2.5">
                      <p>{PLANS[a.plan].name}</p>
                      {a.addonHotel ? (
                        <p className="text-xs text-gold">+ add-on hôtel</p>
                      ) : null}
                      {a.students > 0 ? (
                        <p className="gb-num text-xs text-muted-foreground">{a.students} élèves</p>
                      ) : null}
                    </td>
                    <td className="gb-num py-2.5">{a.businesses}</td>
                    <td className="gb-num py-2.5 text-xs text-muted-foreground">{a.joined}</td>
                    <td className="gb-num py-2.5 text-right font-semibold">{money(accountMRR(a), "HTG")}</td>
                    <td className="py-2.5 text-right">
                      <StatusPill tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5" />
            {metrics.late.length} compte(s) en retard de paiement · restriction automatique après échéance.
          </p>
        </Panel>
      </main>
    </div>
  );
}
