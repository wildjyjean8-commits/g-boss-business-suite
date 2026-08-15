import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BizProvider } from "@/components/gboss/biz-context";
import { AppShell } from "@/components/gboss/app-shell";

export const Route = createFileRoute("/app")({
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
