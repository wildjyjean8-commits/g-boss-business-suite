import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bluetooth, Download, FileImage, Loader2, Printer, Wifi } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useBiz } from "@/components/gboss/biz-context";
import { PageHeader, Panel } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/gboss/data";
import { fetchReceipts, type ReceiptRow } from "@/lib/gboss/accounting";
import { fetchSaleReceiptDetails } from "@/lib/gboss/pos";
import {
  downloadReceiptJpeg,
  downloadReceiptPdf,
  printReceipt,
  type PrintableReceipt,
  type ReceiptFormat,
} from "@/lib/gboss/print-receipt";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/enpresyon")({
  head: () => ({
    meta: [
      { title: "Impression — G-Boss" },
      {
        name: "description",
        content:
          "Imprimez ou téléchargez (PDF/JPEG) vos reçus thermiques 58/80 mm et factures A4, avec logo et infos entreprise.",
      },
      { property: "og:title", content: "Impression — G-Boss" },
      { property: "og:description", content: "Aperçu, impression et téléchargement réels des reçus de votre business." },
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
  const [busy, setBusy] = useState<"print" | "pdf" | "jpeg" | null>(null);

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

  async function buildReceiptPayload(r: ReceiptRow): Promise<PrintableReceipt> {
    const base = {
      businessName: biz.name,
      reference: r.reference,
      currency: biz.currency,
      format,
      logoUrl: biz.logoUrl,
      legalName: biz.legalName,
      address: biz.address,
      phone: biz.phone,
      email: biz.email,
      taxNumber: biz.taxNumber,
    };

    if (r.source === "vant" && r.source_id) {
      const { sale, lines } = await fetchSaleReceiptDetails(r.source_id);
      return {
        ...base,
        date: new Date(sale.occurred_at).toLocaleString("fr-FR"),
        client: r.party,
        lines,
        subtotal: sale.subtotal,
        tax: sale.tax_amount,
        taxRate: biz.taxRate,
        total: sale.total,
        paymentMethod: sale.payment_method ?? "kach",
      };
    }

    // Resi manyèl oswa ki soti nan yon fakti — pa gen detay atik pa atik,
    // n'ap itilize yon sèl liy ak montan total la.
    return {
      ...base,
      date: new Date(r.receipt_date).toLocaleDateString("fr-FR"),
      client: r.party,
      lines: [{ name: r.kind === "vant" ? "Vant" : "Depans", qty: 1, unitPrice: r.amount }],
      subtotal: r.amount,
      tax: 0,
      taxRate: 0,
      total: r.amount,
      paymentMethod: "kach",
    };
  }

  async function handlePrintLast() {
    if (!lastReceipt) {
      toast.error("Pa gen okenn resi pou enprime pou kounye a");
      return;
    }
    setBusy("print");
    try {
      printReceipt(await buildReceiptPayload(lastReceipt));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan chajman resi a");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadPdf() {
    if (!lastReceipt) {
      toast.error("Pa gen okenn resi pou telechaje pou kounye a");
      return;
    }
    setBusy("pdf");
    try {
      await downloadReceiptPdf(await buildReceiptPayload(lastReceipt));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan jenerasyon PDF la");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadJpeg() {
    if (!lastReceipt) {
      toast.error("Pa gen okenn resi pou telechaje pou kounye a");
      return;
    }
    setBusy("jpeg");
    try {
      await downloadReceiptJpeg(await buildReceiptPayload(lastReceipt));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan jenerasyon imaj la");
    } finally {
      setBusy(null);
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
      logoUrl: biz.logoUrl,
      legalName: biz.legalName,
      address: biz.address,
      phone: biz.phone,
      email: biz.email,
      taxNumber: biz.taxNumber,
    });
  }

  return (
    <div>
      <PageHeader
        title="Impression"
        subtitle="Thermique 58/80 mm et A4 · impression réelle, PDF et JPEG avec logo et infos entreprise"
      />

      {!biz.logoUrl && !biz.address && !biz.phone ? (
        <div className="gb-card mb-4 flex items-start gap-3 border-l-4 border-l-accent p-4">
          <div>
            <p className="text-sm font-semibold">Ajoute les infos de ton entreprise</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Va dans Paramètres → Infos entreprise pour ajouter ton logo, adresse et téléphone. Ils apparaîtront
              automatiquement sur tes reçus imprimés et téléchargés.
            </p>
          </div>
        </div>
      ) : null}

      <div className="gb-card mb-4 flex items-start gap-3 border-l-4 border-l-kpi-orange p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-kpi-orange" />
        <div>
          <p className="text-sm font-semibold">Konsènan koneksyon imprimant</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pou enprime sou papye, G-Boss pase pa bwat dyalòg enpresyon aparèy ou a — li pa detekte imprimant
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
          <p className="mt-2 text-sm text-muted-foreground">
            Ou pa gen imprimant sou men w? Telechaje resi a an PDF oswa JPEG epi voye l sou WhatsApp.
          </p>
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
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handlePrintLast} disabled={busy !== null}>
                  {busy === "print" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
                  Imprimer
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadPdf} disabled={busy !== null}>
                  {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Télécharger PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadJpeg} disabled={busy !== null}>
                  {busy === "jpeg" ? <Loader2 className="size-4 animate-spin" /> : <FileImage className="size-4" />}
                  Télécharger JPEG
                </Button>
              </div>
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
