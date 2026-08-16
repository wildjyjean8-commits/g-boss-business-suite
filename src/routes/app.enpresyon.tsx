import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bluetooth, Printer, Wifi } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/gboss/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/enpresyon")({
  head: () => ({
    meta: [
      { title: "Impression — G-Boss" },
      {
        name: "description",
        content: "Imprimez reçus thermiques 58/80 mm et factures A4 via WiFi ou Bluetooth (Android).",
      },
      { property: "og:title", content: "Impression — G-Boss" },
      { property: "og:description", content: "Configuration des imprimantes thermiques et A4 de votre business." },
    ],
  }),
  component: Printing,
});

const FORMATS = [
  { id: "58", label: "Thermique 58 mm", desc: "Reçus de caisse compacts" },
  { id: "80", label: "Thermique 80 mm", desc: "Reçus détaillés / cuisine" },
  { id: "a4", label: "Facture A4", desc: "Factures officielles avec taxes" },
] as const;

const PRINTERS = [
  { id: "pr1", name: "Caisse — Xprinter 80", conn: "wifi" as const, ip: "192.168.1.42", ready: true },
  { id: "pr2", name: "Cuisine — Goojprt 58", conn: "bluetooth" as const, ip: "BT:3C:2A:11", ready: true },
  { id: "pr3", name: "Bureau — HP LaserJet A4", conn: "wifi" as const, ip: "192.168.1.77", ready: false },
];

function Printing() {
  const { biz } = useBiz();
  const [format, setFormat] = useState<string>("80");
  const inv = biz.invoices[0];

  return (
    <div>
      <PageHeader
        title="Impression"
        subtitle="Thermique 58/80 mm et A4 · WiFi (iOS/Android) ou Bluetooth (Android uniquement)"
      />

      <div className="gb-card mb-4 flex items-start gap-3 border-l-4 border-l-kpi-orange p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-kpi-orange" />
        <div>
          <p className="text-sm font-semibold">Avertissement iOS</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sur iPhone et iPad, l'impression Bluetooth directe n'est pas prise en charge par le navigateur.
            Utilisez une imprimante WiFi/réseau. Le Bluetooth reste disponible sur Android.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Imprimantes configurées" className="lg:col-span-2">
          <div className="space-y-3">
            {PRINTERS.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                  {p.conn === "wifi" ? <Wifi className="size-4" /> : <Bluetooth className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="gb-num truncate text-xs text-muted-foreground">
                    {p.conn === "wifi" ? "WiFi" : "Bluetooth (Android)"} · {p.ip}
                  </p>
                </div>
                <StatusPill tone={p.ready ? "ok" : "low"}>{p.ready ? "Prête" : "Hors ligne"}</StatusPill>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    p.ready
                      ? toast.success(`Test envoyé à ${p.name}`)
                      : toast.error(`${p.name} est hors ligne`)
                  }
                >
                  Test
                </Button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => toast.success("Recherche d'imprimantes lancée (démonstration)")}
          >
            <Printer className="size-4" /> Détecter une imprimante
          </Button>
        </Panel>

        <Panel title="Format & aperçu">
          <div className="space-y-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  format === f.id ? "border-accent bg-accent/10" : "border-border hover:bg-secondary",
                )}
              >
                <span className="block text-sm font-semibold">{f.label}</span>
                <span className="block text-xs text-muted-foreground">{f.desc}</span>
              </button>
            ))}
          </div>

          <div
            className={cn(
              "gb-num mx-auto mt-4 rounded-lg border border-dashed border-border bg-background p-3 text-[11px]",
              format === "58" ? "max-w-[190px]" : format === "80" ? "max-w-[240px]" : "max-w-full",
            )}
          >
            <p className="text-center font-display text-xs font-bold">{biz.name}</p>
            <p className="text-center text-muted-foreground">Taxe {biz.taxRate}% · {biz.currency}</p>
            <div className="my-2 border-t border-dashed border-border" />
            <p>Facture {inv?.id ?? "—"}</p>
            <p className="truncate">Client {inv?.client ?? "—"}</p>
            <div className="my-2 border-t border-dashed border-border" />
            <p className="flex justify-between font-semibold">
              <span>TOTAL</span>
              <span>{money(inv?.amount ?? 0, biz.currency)}</span>
            </p>
          </div>

          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={() => toast.success(`Impression ${format === "a4" ? "A4" : `${format} mm`} envoyée`)}
          >
            Imprimer
          </Button>
        </Panel>
      </div>
    </div>
  );
}
