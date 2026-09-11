import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, ClipboardList, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { GBossLogoDark } from "@/components/gboss/logo";
import { LangSwitcher } from "@/components/gboss/lang-switcher";
import { Button } from "@/components/ui/button";
import { PLANS, HOTEL_ADDON_PRICE, TRIAL_DAYS } from "@/lib/gboss/data";
import heroDashboard from "@/assets/hero-dashboard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "G-Boss — Plateforme privée de gestion d'entreprise" },
      {
        name: "description",
        content:
          "G-Boss gère votre business : stock, facturation, caisse, équipe, tâches et rapports. 8 jours d'essai gratuit, installable comme une app.",
      },
      { property: "og:title", content: "G-Boss — Gérer. Organiser. Développer." },
      {
        property: "og:description",
        content:
          "Plateforme privée de gestion d'entreprise : stock, facturation, caisse, équipe, tâches, rapports.",
      },
    ],
  }),
  component: Landing,
});

const MODULES = [
  { icon: BarChart3, title: "Tableau de bord", text: "Revenus, dépenses, équipe et tâches en un écran." },
  { icon: ReceiptText, title: "Faktirasyon", text: "Factures avec logo, signature et suivi des retards." },
  { icon: Boxes, title: "Estòk / Market", text: "SKU, code-barres, entrées/sorties, valeur du stock." },
  { icon: ClipboardList, title: "Tach", text: "Kanban, liste et calendrier, commentaires intégrés." },
  { icon: Users, title: "Ekip", text: "Rôles, permissions, présence et performance." },
  { icon: ShieldCheck, title: "Rapò", text: "Ventes, achats, finances, livraisons, performance." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <GBossLogoDark />
        <div className="flex items-center gap-2">
          <LangSwitcher />
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Connexion</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/enskripsyon">Inscription</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-10 pb-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="gb-label">Plateforme privée · PWA installable</p>
            <h1 className="mt-3 text-4xl leading-tight font-bold text-foreground sm:text-5xl">
              Gérez tout votre business dans <span className="gb-gradient-text">une seule</span> plateforme.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              G-Boss ne vend rien à vos clients : elle organise vos données, votre stock, votre équipe,
              vos factures et vos rapports. {TRIAL_DAYS} jours d'essai gratuit, mode offline, 4 langues.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/enskripsyon">
                  Commencer l'essai gratuit <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/app">Voir la démo du dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-[image:var(--gradient-brand)] opacity-20 blur-2xl" />
            <img
              src={heroDashboard}
              alt="Équipe consultant le tableau de bord G-Boss : ventes, stock, tâches et rapports en temps réel"
              className="w-full rounded-2xl border border-border shadow-[var(--shadow-pop)]"
              width={1166}
              height={836}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <article key={m.title} className="gb-card p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <m.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold">{m.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="font-display text-2xl font-bold">Plans mensuels</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {(["esansyel", "estanda", "premyom", "kanpis"] as const).map((id) => (
            <article key={id} className="gb-card p-5">
              <h3 className="font-display text-lg font-semibold">{PLANS[id].name}</h3>
              <p className="gb-num mt-2 text-2xl font-bold text-kpi-blue">{PLANS[id].price}</p>
              <p className="text-xs text-muted-foreground">{PLANS[id].unit}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {id === "esansyel" && "1 personne · dashboard, tâches, rapports, facture, stock."}
                {id === "estanda" && "2 à 5 personnes · chat interne, audio/vidéo, permissions."}
                {id === "premyom" && "Jusqu'à 20 personnes · canaux par département, admin multi-niveaux."}
                {id === "kanpis" && "Institution : élèves, bulletins, diplômes, devoirs, cours vidéo."}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Add-on « Airbnb and Hotel » : {HOTEL_ADDON_PRICE} HTG/mois · 2 business sous un même compte :
          -30% sur le 2e plan.
        </p>
      </section>
    </div>
  );
}
