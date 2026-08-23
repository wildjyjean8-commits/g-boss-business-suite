import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bluetooth, Loader2, Printer, Wifi } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useBiz } from "@/components/gboss/biz-context";
import { PageHeader, Panel } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/gboss/data";
import { fetchReceipts } from "@/lib/gboss/accounting";
import { fetchSaleReceiptDetails } from "@/lib/gboss/pos";
import { printReceipt, type ReceiptFormat } from "@/lib/gboss/print-receipt";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/enpresyon")({
  head: () => ({
    meta: [
      { title: "Impression — G-Boss" },
      {
        name: "description",
        content: "Imprimez reçus thermiques 58/80 mm et factures A4 via l'imprimante système de votre appareil.",
      },
      { property: "og:title", content: "Impression — G-Boss" },
      { property: "og:description", content: "Aperçu et impression réelle des reçus de votre business." },
    ],
  }),
  component: Printing,
});

const FORMATS: { id: ReceiptFormat; label: string; desc: string }[] = [
  { id: "58", label: "Thermique 58 mm", desc: "Reçus de caisse compacts" },
  { id: "80", label: "Thermique 80 mm", desc: "Reçus détaillés / cuisine" },
  { id: "a4", label: "Facture A4", desc: "Factures officielles avec taxes" },
];

function Printing() {
  const { biz } = useBiz();
  const [format, setFormat] = useState<ReceiptFormat>("80");
  const [printing, setPrinting] = useState(false);

  const receiptsQuery = useQuery({
    queryKey: ["receipts", biz.id],
    queryFn: () => fetchReceipts(biz.id),
  });

  const lastReceipt = receiptsQuery.data?.[0] ?? null;

  const preview = useMemo(() => {
    if (!lastReceipt) return null;
    return {
      reference: lastReceipt.reference,
      client: lastReceipt.party ?? "—",
      amount: lastReceipt.amount,
    };
  }, [lastReceipt]);

  async function handlePrintLast() {
    if (!lastReceipt) {
      toast.error("Pa gen okenn resi pou enprime pou kounye a");
      return;
    }
    setPrinting(true);
    try {
      if (lastReceipt.source === "vant" && lastReceipt.source_id) {
        const { sale, lines } = await fetchSaleReceiptDetails(lastReceipt.source_id);
        printReceipt({
          businessName: biz.name,
          reference: lastReceipt.reference,
          date: new Date(sale.occurred_at).toLocaleString("fr-FR"),
          client: lastReceipt.party,
          lines,
          subtotal: sale.subtotal,
          tax: sale.tax_amount,
          taxRate: biz.taxRate,
          total: sale.total,
          currency: biz.currency,
          paymentMethod: sale.payment_method ?? "kach",
          format,
        });
      } else {
        // Resi manyèl oswa ki soti nan yon fakti — pa gen detay atik pa atik,
        // n'ap enprime yon sèl liy ak montan total la.
        printReceipt({
          businessName: biz.name,
          reference: lastReceipt.reference,
          date: new Date(lastReceipt.receipt_date).toLocaleDateString("fr-FR"),
          client: lastReceipt.party,
          lines: [{ name: lastReceipt.kind === "vant" ? "Vant" : "Depans", qty: 1, unitPrice: lastReceipt.amount }],
          subtotal: lastReceipt.amount,
          tax: 0,
          taxRate: 0,
          total: lastReceipt.amount,
          currency: biz.currency,
          paymentMethod: "kach",
          format,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan chajman resi a");
    } finally {
      setPrinting(false);
    }
  }

  function handleTestPrint() {
    printReceipt({
      businessName: biz.name,
      reference: "TEST",
      date: new Date().toLocaleString("fr-FR"),
      client: null,
      lines: [{ name: "Paj tès enpresyon", qty: 1, unitPrice: 0 }],
      subtotal: 0,
      tax: 0,
      taxRate: 0,
      total: 0,
      currency: biz.currency,
      paymentMethod: "kach",
      format,
    });
  }

  return (
    <div>
      <PageHeader
        title="Impression"
        subtitle="Thermique 58/80 mm et A4 · via l'imprimante configurée sur votre téléphone ou ordinateur"
      />

      <div className="gb-card mb-4 flex items-start gap-3 border-l-4 border-l-kpi-orange p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-kpi-orange" />
        <div>
          <p className="text-sm font-semibold">Konsènan koneksyon imprimant</p>
          <p className="mt-1 text-sm text-muted-foreground">
            G-Boss enprime atravè bwat dyalòg enpresyon aparèy ou a (navigatè web la) — li pa detekte imprimant
            otomatikman. Pou sa mache byen :
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Wifi className="size-3.5" /> WiFi / rezo
              </span>{" "}
              — enstale imprimant lan kòm yon imprimant sistèm (iOS, Android, Windows oswa Mac) yon sèl fwa ; li ap
              parèt nan lis la lè w klike "Imprimer".
            </li>
            <li>
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Bluetooth className="size-3.5" /> Bluetooth (Android sèlman)
              </span>{" "}
              — pase pa yon app enpresyon konpatib enstale sou telefòn nan (pa disponib sou iPhone/iPad).
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Dernier reçu" className="lg:col-span-2">
          {receiptsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement...
            </div>
          ) : !lastReceipt ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Pa gen okenn resi ankò. Fè yon vant nan Kès/Vant oswa ajoute yon depans nan Kontabilite pou wè yon
              aperçu isit la.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{preview?.reference}</p>
                  <p className="gb-num text-sm font-semibold">{money(preview?.amount ?? 0, biz.currency)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastReceipt.kind === "vant" ? "Vant" : "Depans"} · {preview?.client}
                </p>
              </div>
              <Button size="sm" onClick={handlePrintLast} disabled={printing}>
                {printing ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
                Imprimer ce reçu
              </Button>
            </div>
          )}
        </Panel>

        <Panel title="Format & test">
          <div className="space-y-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
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

          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={handleTestPrint}>
            <Printer className="size-4" /> Imprimer une page de test
          </Button>
        </Panel>
      </div>
    </div>
  );
}
