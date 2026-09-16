import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { BizProvider, useBiz } from "@/components/gboss/biz-context";
import { AppShell, NAV } from "@/components/gboss/app-shell";
import { ROLE_NAV_ALLOW } from "@/lib/gboss/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    return { session: data.session };
  },
  head: () => ({
    meta: [
      { title: "Espace G-Boss — Gestion d'entreprise" },
      {
        name: "description",
        content:
          "Espace de travail G-Boss : stock, facturation, caisse, équipe, tâches et rapports pour votre business.",
      },
      { property: "og:title", content: "Espace G-Boss — Gestion d'entreprise" },
      {
        property: "og:description",
        content: "Pilotez votre business : stock, facturation, caisse, équipe et rapports.",
      },
    ],
  }),
  component: AppLayout,
});

function RoleGuardedOutlet() {
  const { myRole, isOwner } = useBiz();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const allow = !isOwner && myRole ? ROLE_NAV_ALLOW[myRole] : undefined;
  const navItem = NAV.find((n) => n.to === pathname);
  const blocked = !!allow && !!navItem && !allow.includes(navItem.key);

  useEffect(() => {
    if (blocked) navigate({ to: "/app" });
  }, [blocked, pathname]);

  if (blocked) return null;
  return <Outlet />;
}

function AppLayout() {
  return (
    <BizProvider>
      <AppShell>
        <RoleGuardedOutlet />
      </AppShell>
    </BizProvider>
  );
}
