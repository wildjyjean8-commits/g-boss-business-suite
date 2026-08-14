import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const KPI_COLORS = {
  blue: { bar: "bg-kpi-blue", text: "text-kpi-blue", soft: "bg-kpi-blue/10" },
  green: { bar: "bg-kpi-green", text: "text-kpi-green", soft: "bg-kpi-green/10" },
  orange: { bar: "bg-kpi-orange", text: "text-kpi-orange", soft: "bg-kpi-orange/10" },
  red: { bar: "bg-kpi-red", text: "text-kpi-red", soft: "bg-kpi-red/10" },
  purple: { bar: "bg-kpi-purple", text: "text-kpi-purple", soft: "bg-kpi-purple/10" },
} as const;

export type KpiTone = keyof typeof KPI_COLORS;

export function KpiCard({
  label,
  value,
  delta,
  tone = "blue",
  icon,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: KpiTone;
  icon?: ReactNode;
  hint?: string;
}) {
  const c = KPI_COLORS[tone];
  return (
    <div className="gb-card relative overflow-hidden p-4">
      <span className={cn("absolute inset-y-0 left-0 w-1", c.bar)} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <p className="gb-label truncate">{label}</p>
          <p className="gb-num mt-1.5 truncate text-xl font-semibold text-foreground">{value}</p>
          {delta ? <p className="mt-1 text-xs font-medium text-delta-up">{delta}</p> : null}
          {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", c.soft, c.text)}>
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("gb-card flex flex-col p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "ok" | "low" | "crit" | "neutral"; children: ReactNode }) {
  const map = {
    ok: "bg-status-ok text-kpi-green",
    low: "bg-status-low text-kpi-orange",
    crit: "bg-status-crit text-kpi-red",
    neutral: "bg-secondary text-muted-foreground",
  } as const;
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", map[tone])}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: KpiTone }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full transition-all", KPI_COLORS[tone].bar)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
