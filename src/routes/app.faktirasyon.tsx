import { createFileRoute } from "@tanstack/react-router";
import { Plus, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { invoiceMetrics, money } from "@/lib/gboss/data";

export const Route = createFileRoute("/app/faktirasyon")({
  head: () => ({
    meta: [
      { title: "Facturation — G-Boss" },
      { name: "description", content: "Créez, suivez et imprimez vos factures : payées, en attente, expirées." },
      { property: "og:title", content: "Facturation — G-Boss" },
      { property: "og:description", content: "Créez et suivez vos factures en HTG ou USD." },
    ],
  }),
  component: Invoicing,
});

const STATUS = {
  paye: { tone: "ok", label: "Payée" },
  attente: { tone: "low", label: "En attente" },
  expire: { tone: "crit", label: "Expirée" },
} as const;

function Invoicing() {
  const { biz } = useBiz();
  const m = invoiceMetrics(biz);
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Facturation"
        subtitle={`${biz.invoices.length} factures · taxe ${biz.taxRate}%`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Nouvelle facture
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle facture</DialogTitle>
                <DialogDescription>
                  Le total inclut automatiquement la taxe de {biz.taxRate}%.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="client">Client</Label>
                  <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom du client" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Montant hors taxe ({biz.currency})</Label>
                  <Input id="amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
                </div>
                <p className="gb-num rounded-lg bg-secondary p-3 text-sm">
                  Total :{" "}
                  {money(Number(amount || 0) * (1 + biz.taxRate / 100), biz.currency)}
                </p>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!client || !amount) {
                      toast.error("Renseignez le client et le montant.");
                      return;
                    }
                    setOpen(false);
                    setClient("");
                    setAmount("");
                    toast.success("Facture créée (démonstration)");
                  }}
                >
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total facturé" value={money(m.total, biz.currency)} tone="blue" />
        <KpiCard label="Encaissé" value={money(m.paid, biz.currency)} tone="green" />
        <KpiCard label="En attente" value={money(m.pending, biz.currency)} tone="orange" />
        <KpiCard label="Expiré" value={money(m.expired, biz.currency)} tone="red" />
      </div>

      <Panel title="Toutes les factures" className="mt-4">
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="gb-label py-2">N°</th>
                <th className="gb-label py-2">Client</th>
                <th className="gb-label py-2">Date</th>
                <th className="gb-label py-2">Échéance</th>
                <th className="gb-label py-2 text-right">Montant</th>
                <th className="gb-label py-2 text-right">Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {biz.invoices.map((i) => (
                <tr key={i.id} className="border-b border-border/60">
                  <td className="gb-num py-2.5 font-medium">{i.id}</td>
                  <td className="py-2.5">{i.client}</td>
                  <td className="gb-num py-2.5 text-muted-foreground">{i.date}</td>
                  <td className="gb-num py-2.5 text-muted-foreground">{i.due}</td>
                  <td className="gb-num py-2.5 text-right font-semibold">{money(i.amount, biz.currency)}</td>
                  <td className="py-2.5 text-right">
                    <StatusPill tone={STATUS[i.status].tone}>{STATUS[i.status].label}</StatusPill>
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    <Button variant="ghost" size="icon" onClick={() => toast.info("Aperçu d'impression 80mm / A4")}>
                      <Printer className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
