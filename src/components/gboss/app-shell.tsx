import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  Hotel,
  LayoutDashboard,
  Menu,
  Package,
  PieChart,
  Printer,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { GBossLogo } from "./logo";
import { LangSwitcher } from "./lang-switcher";
import { useBiz } from "./biz-context";
import { useI18n } from "@/lib/gboss/i18n";
import { PLANS } from "@/lib/gboss/data";
import { useSession, signOut } from "@/lib/gboss/use-session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { to: string; key: string; icon: typeof LayoutDashboard; requires?: "pos" | "hotel" | "school" };

const NAV: NavItem[] = [
  { to: "/app", key: "dashboard", icon: LayoutDashboard },
  { to: "/app/faktirasyon", key: "invoicing", icon: FileText },
  { to: "/app/estok", key: "stock", icon: Package },
  { to: "/app/kes", key: "pos", icon: ShoppingCart, requires: "pos" },
  { to: "/app/rapo", key: "reports", icon: PieChart },
  { to: "/app/kontabilite", key: "accounting", icon: Receipt },
  { to: "/app/founise", key: "suppliers", icon: Truck },
  { to: "/app/ekip", key: "team", icon: Users },
  { to: "/app/tach", key: "tasks", icon: ClipboardList },
  { to: "/app/enstitisyon", key: "school", icon: GraduationCap, requires: "school" },
  { to: "/app/otel", key: "hotel", icon: Hotel, requires: "hotel" },
  { to: "/app/enpresyon", key: "printing", icon: Printer },
  { to: "/app/paramet", key: "settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { biz } = useBiz();
  const { isSuperAdmin } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = NAV.filter((item) => {
    if (item.requires === "pos") return biz.posEnabled;
    if (item.requires === "hotel") return biz.hotelAddon;
    if (item.requires === "school") return biz.schoolAddon || biz.students.length > 0;
    return true;
  });

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="px-4 py-5">
        <GBossLogo />
      </div>
      <BizSwitcher />
      <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {items.map((item) => {
          const active = item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        {isSuperAdmin ? (
          <Link
            to="/superadmin"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gold hover:bg-sidebar-accent"
          >
            <Building2 className="size-4" /> {t("superadmin")}
          </Link>
        ) : null}
        <p className="mt-2 px-3 text-[10px] text-sidebar-foreground/50">
          {PLANS[biz.plan].name} · {PLANS[biz.plan].price} {PLANS[biz.plan].unit}
        </p>
      </div>
    </div>
  );
}

function BizSwitcher() {
  const { businesses, biz, setBizId } = useBiz();
  return (
    <div className="px-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5 text-left text-sm text-white">
            <span className="min-w-0">
              <span className="block truncate font-semibold">{biz.name}</span>
              <span className="block truncate text-[10px] text-sidebar-foreground/60">
                {biz.sector}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs">Mes business (max 2)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {businesses.map((b) => (
            <DropdownMenuItem key={b.id} onClick={() => setBizId(b.id)} className="gap-2">
              <span className="flex-1 truncate">{b.name}</span>
              {b.id === biz.id ? <Check className="size-4 text-kpi-green" /> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs">
            Données strictement séparées · +30% sur le plan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function UserMenu() {
  const { session } = useSession();
  const email = session?.user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase() || "??";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="grid size-9 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate text-xs">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>Déconnexion</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { biz } = useBiz();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-none bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation G-Boss</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold">{biz.name}</p>
            <p className="gb-num truncate text-[11px] text-muted-foreground">
              {biz.currency} · 1 USD = {biz.rate} HTG · taxe {biz.taxRate}%
            </p>
          </div>

          <LangSwitcher />
          <UserMenu />
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
