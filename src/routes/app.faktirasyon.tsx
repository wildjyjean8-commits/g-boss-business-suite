import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { money } from "@/lib/gboss/data";
import {
  createInvoice,
  deleteInvoice,
  fetchInvoices,
  invoiceMetrics,
  updateInvoiceStatus,
  type InvoiceRow,
  type InvoiceStatus,
} from "@/lib/gboss/invoices";

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Invoicing() {
  const { biz } = useBiz();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ["invoices", biz.id],
    queryFn: () => fetchInvoices(biz.id),
  });
  const invoices = invoicesQuery.data ?? [];
  const m = invoiceMetrics(invoices);

  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRow | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!client.trim() || !amount) {
        throw new Error("Antre non kliyan an ak montan an.");
      }
      const total = Number(amount) * (1 + biz.taxRate / 100);
      await createInvoice(biz.id, {
        client: client.trim(),
        amount: total,
        status: "attente",
        issue_date: todayStr(),
        due_date: dueDate || null,
      });
    },
    onSuccess: () => {
      toast.success("Facture créée");
      setOpen(false);
      setClient("");
      setAmount("");
      setDueDate("");
      queryClient.invalidateQueries({ queryKey: ["invoices", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan kreyasyon fakti a"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => updateInvoiceStatus(id, status),
    onSuccess: () => {
      toast.success("Statut modifye");
      queryClient.invalidateQueries({ queryKey: ["invoices", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan chanjman estati a"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteInvoice(id),
    onSuccess: () => {
      toast.success("Facture efase");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["invoices", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan efasman an"),
  });

  return (
    <div>
      <PageHeader
        title="Facturation"
        subtitle={`${invoices.length} factures · taxe ${biz.taxRate}%`}
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
                <div className="space-y-1.5">
                  <Label htmlFor="due">Échéance (optionnel)</Label>
                  <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <p className="gb-num rounded-lg bg-secondary p-3 text-sm">
                  Total :{" "}
                  {money(Number(amount || 0) * (1 + biz.taxRate / 100), biz.currency)}
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
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
        {invoicesQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement des factures...
          </div>
        ) : invoices.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucune facture pour l'instant — cliquez sur « Nouvelle facture ».
          </p>
        ) : (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
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
                {invoices.map((i) => (
                  <tr key={i.id} className="border-b border-border/60">
                    <td className="gb-num py-2.5 font-medium">{i.reference}</td>
                    <td className="py-2.5">{i.client}</td>
                    <td className="gb-num py-2.5 text-muted-foreground">{i.issue_date}</td>
                    <td className="gb-num py-2.5 text-muted-foreground">{i.due_date ?? "—"}</td>
                    <td className="gb-num py-2.5 text-right font-semibold">{money(i.amount, biz.currency)}</td>
                    <td className="py-2.5 text-right">
                      <Select
                        value={i.status}
                        onValueChange={(v) => statusMutation.mutate({ id: i.id, status: v as InvoiceStatus })}
                      >
                        <SelectTrigger className="ml-auto h-7 w-[130px] border-none bg-transparent p-0 shadow-none focus:ring-0">
                          <StatusPill tone={STATUS[i.status as InvoiceStatus].tone}>
                            {STATUS[i.status as InvoiceStatus].label}
                          </StatusPill>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paye">Payée</SelectItem>
                          <SelectItem value="attente">En attente</SelectItem>
                          <SelectItem value="expire">Expirée</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Aperçu d'impression 80mm / A4")}>
                          <Printer className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(i)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase fakti « {deleteTarget?.reference} » ?</AlertDialogTitle>
            <AlertDialogDescription>Aksyon sa a pa ka anile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Efase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
