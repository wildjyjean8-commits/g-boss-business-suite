import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BizProvider } from "@/components/gboss/biz-context";
import { AppShell } from "@/components/gboss/app-shell";
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

function AppLayout() {
  return (
    <BizProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </BizProvider>
  );
}
