import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileImage, Loader2, Plus, Printer, Receipt as ReceiptIcon, Search, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { fetchSaleReceiptDetails } from "@/lib/gboss/pos";
import { printReceipt } from "@/lib/gboss/print-receipt";
import {
  accountBreakdown,
  createAccount,
  createReceipt,
  deleteAccount,
  deleteReceipt,
  fetchAccounts,
  fetchReceipts,
  financialSummary,
  monthlySeries,
  uploadReceiptFile,
  type AccountInput,
  type AccountType,
  type ReceiptInput,
  type ReceiptKind,
  type ReceiptRow,
} from "@/lib/gboss/accounting";

export const Route = createFileRoute("/app/kontabilite")({
  head: () => ({
    meta: [
      { title: "Comptabilité — G-Boss" },
      { name: "description", content: "Livre de comptes, résumé financier, catégories et bibliothèque de reçus." },
      { property: "og:title", content: "Comptabilité — G-Boss" },
      { property: "og:description", content: "Reçus, catégories et rapports financiers réels." },
    ],
  }),
  component: Accounting,
});

const EMPTY_ACCOUNT: AccountInput = { name: "", type: "depans" };
const EMPTY_RECEIPT: ReceiptInput = {
  kind: "depans",
  party: "",
  account_id: null,
  amount: 0,
  receipt_date: new Date().toISOString().slice(0, 10),
  file_url: null,
};

function Accounting() {
  const { biz } = useBiz();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const accountsQuery = useQuery({ queryKey: ["accounts", biz.id], queryFn: () => fetchAccounts(biz.id) });
  const receiptsQuery = useQuery({ queryKey: ["receipts", biz.id], queryFn: () => fetchReceipts(biz.id) });
  const accounts = accountsQuery.data ?? [];
  const receipts = receiptsQuery.data ?? [];

  const summary = financialSummary(receipts);
  const series = monthlySeries(receipts);
  const breakdown = accountBreakdown(receipts, accounts);

  const [q, setQ] = useState("");
  const [kindFilter, setKindFilter] = useState<"tout" | ReceiptKind>("tout");
  const filtered = useMemo(
    () =>
      receipts.filter(
        (r) =>
          (kindFilter === "tout" || r.kind === kindFilter) &&
          ((r.party ?? "").toLowerCase().includes(q.toLowerCase()) || r.reference.toLowerCase().includes(q.toLowerCase())),
      ),
    [receipts, q, kindFilter],
  );

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountInput>(EMPTY_ACCOUNT);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState<ReceiptInput>(EMPTY_RECEIPT);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReceiptRow | null>(null);
  const [reprintingId, setReprintingId] = useState<string | null>(null);

  async function handleReprint(r: ReceiptRow) {
    if (!r.source_id) return;
    setReprintingId(r.id);
    try {
      const { sale, lines } = await fetchSaleReceiptDetails(r.source_id);
      printReceipt({
        businessName: biz.name,
        reference: r.reference,
        date: new Date(sale.occurred_at).toLocaleString("fr-FR"),
        client: r.party,
        lines,
        subtotal: sale.subtotal,
        tax: sale.tax_amount,
        taxRate: biz.taxRate,
        total: sale.total,
        currency: biz.currency,
        paymentMethod: sale.payment_method ?? "kach",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan chajman resi a");
    } finally {
      setReprintingId(null);
    }
  }

  const createAccountMutation = useMutation({
    mutationFn: async () => {
      if (!accountForm.name.trim()) throw new Error("Antre non kategori a.");
      return createAccount(biz.id, accountForm);
    },
    onSuccess: () => {
      toast.success("Catégorie ajoutée");
      setAccountOpen(false);
      setAccountForm(EMPTY_ACCOUNT);
      queryClient.invalidateQueries({ queryKey: ["accounts", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts", biz.id] }),
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const createReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!receiptForm.amount || receiptForm.amount <= 0) throw new Error("Antre yon montan valab.");
      await createReceipt(biz.id, receiptForm);
    },
    onSuccess: () => {
      toast.success("Reçu enregistré");
      setReceiptOpen(false);
      setReceiptForm(EMPTY_RECEIPT);
      queryClient.invalidateQueries({ queryKey: ["receipts", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan anrejistreman an"),
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: async (id: string) => deleteReceipt(id),
    onSuccess: () => {
      toast.success("Reçu efase");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["receipts", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadReceiptFile(biz.id, file);
      setReceiptForm((f) => ({ ...f, file_url: url }));
      toast.success("Fichier attaché");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan chajman fichye a");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Comptabilité"
        subtitle={`${biz.name} · ${receipts.length} reçus enregistrés`}
        actions={
          <>
            <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="size-4" /> Catégorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle catégorie</DialogTitle>
                  <DialogDescription>Créez vos propres catégories de revenus ou dépenses.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="a-name">Nom</Label>
                    <Input
                      id="a-name"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ex: Loyer, Transport, Vente boutique"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={accountForm.type}
                      onValueChange={(v) => setAccountForm((f) => ({ ...f, type: v as AccountType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="depans">Dépense</SelectItem>
                        <SelectItem value="revenu">Revenu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createAccountMutation.mutate()} disabled={createAccountMutation.isPending}>
                    {createAccountMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" /> Nouveau reçu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau reçu</DialogTitle>
                  <DialogDescription>Enregistré directement dans votre livre de comptes.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={receiptForm.kind}
                      onValueChange={(v) => setReceiptForm((f) => ({ ...f, kind: v as ReceiptKind }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="depans">Dépense</SelectItem>
                        <SelectItem value="vant">Vente / Revenu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="r-party">{receiptForm.kind === "vant" ? "Client" : "Fournisseur / bénéficiaire"}</Label>
                    <Input
                      id="r-party"
                      value={receiptForm.party ?? ""}
                      onChange={(e) => setReceiptForm((f) => ({ ...f, party: e.target.value || null }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Catégorie</Label>
                    <Select
                      value={receiptForm.account_id ?? "none"}
                      onValueChange={(v) => setReceiptForm((f) => ({ ...f, account_id: v === "none" ? null : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sans catégorie</SelectItem>
                        {accounts
                          .filter((a) => a.type === (receiptForm.kind === "vant" ? "revenu" : "depans"))
                          .map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="r-amount">Montant ({biz.currency})</Label>
                      <Input
                        id="r-amount"
                        type="number"
                        min={0}
                        value={receiptForm.amount}
                        onChange={(e) => setReceiptForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="r-date">Date</Label>
                      <Input
                        id="r-date"
                        type="date"
                        value={receiptForm.receipt_date}
                        onChange={(e) => setReceiptForm((f) => ({ ...f, receipt_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pièce jointe (photo / PDF)</Label>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="size-4 animate-spin" /> : <FileImage className="size-4" />}
                      {receiptForm.file_url ? "Fichier attaché ✓" : "Choisir un fichier"}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createReceiptMutation.mutate()} disabled={createReceiptMutation.isPending}>
                    {createReceiptMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Enregistrer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Revenus (reçus)" value={money(summary.revenue, biz.currency)} tone="green" />
        <KpiCard label="Dépenses (reçus)" value={money(summary.expense, biz.currency)} tone="orange" />
        <KpiCard label="Résultat net" value={money(summary.net, biz.currency)} tone={summary.net >= 0 ? "blue" : "red"} />
        <KpiCard label="Catégories" value={String(accounts.length)} tone="purple" />
      </div>

      <Tabs defaultValue="receipts" className="mt-4">
        <TabsList>
          <TabsTrigger value="receipts">Bibliothèque de reçus</TabsTrigger>
          <TabsTrigger value="reports">Rapports financiers</TabsTrigger>
          <TabsTrigger value="accounts">Livre de comptes</TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="mt-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher client, fournisseur, référence" className="pl-9" />
            </div>
            <div className="flex gap-1.5">
              <Button variant={kindFilter === "tout" ? "default" : "outline"} size="sm" onClick={() => setKindFilter("tout")}>
                Tous
              </Button>
              <Button variant={kindFilter === "vant" ? "default" : "outline"} size="sm" onClick={() => setKindFilter("vant")}>
                Ventes
              </Button>
              <Button variant={kindFilter === "depans" ? "default" : "outline"} size="sm" onClick={() => setKindFilter("depans")}>
                Dépenses
              </Button>
            </div>
          </div>

          <Panel title={`Reçus (${filtered.length})`}>
            {receiptsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {receipts.length === 0
                  ? "Aucun reçu pour l'instant — les ventes en génèrent automatiquement, ou ajoutez une dépense."
                  : "Aucun reçu ne correspond à votre recherche."}
              </p>
            ) : (
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="gb-label py-2">Référence</th>
                      <th className="gb-label py-2">Date</th>
                      <th className="gb-label py-2">Client / Fournisseur</th>
                      <th className="gb-label py-2">Origine</th>
                      <th className="gb-label py-2 text-right">Montant</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b border-border/60">
                        <td className="gb-num py-2.5 font-medium">
                          <span className="flex items-center gap-1.5">
                            <ReceiptIcon className="size-3.5 text-muted-foreground" />
                            {r.reference}
                          </span>
                        </td>
                        <td className="gb-num py-2.5 text-muted-foreground">{r.receipt_date}</td>
                        <td className="py-2.5">{r.party ?? "—"}</td>
                        <td className="py-2.5">
                          <StatusPill tone={r.kind === "vant" ? "ok" : "low"}>
                            {r.kind === "vant" ? "Revenu" : "Dépense"}
                          </StatusPill>
                        </td>
                        <td className="gb-num py-2.5 text-right font-semibold">{money(r.amount, biz.currency)}</td>
                        <td className="py-2.5 pl-2 text-right">
                          <div className="flex justify-end gap-1">
                            {r.source === "vant" && r.source_id ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={reprintingId === r.id}
                                onClick={() => handleReprint(r)}
                              >
                                {reprintingId === r.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Printer className="size-4" />
                                )}
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(r)}
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
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Profit & Perte (6 derniers mois)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ left: -18, right: 6, top: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" name="Revenus" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
                    <Area type="monotone" dataKey="expense" name="Dépenses" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.12} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Résumé">
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Total revenus</span>
                  <span className="gb-num font-semibold text-kpi-green">{money(summary.revenue, biz.currency)}</span>
                </li>
                <li className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Total dépenses</span>
                  <span className="gb-num font-semibold text-kpi-orange">{money(summary.expense, biz.currency)}</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="font-semibold">Résultat net (cash flow)</span>
                  <span className={`gb-num font-bold ${summary.net >= 0 ? "text-kpi-green" : "text-kpi-red"}`}>
                    {money(summary.net, biz.currency)}
                  </span>
                </li>
              </ul>
            </Panel>

            <Panel title="Répartition par catégorie" className="lg:col-span-2">
              {breakdown.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée pour l'instant.</p>
              ) : (
                <ul className="space-y-2">
                  {breakdown.map((b) => (
                    <li key={b.name} className="flex items-center gap-3">
                      <StatusPill tone={b.type === "revenu" ? "ok" : "low"}>{b.type === "revenu" ? "Revenu" : "Dépense"}</StatusPill>
                      <span className="flex-1 truncate text-sm">{b.name}</span>
                      <span className="gb-num text-sm font-semibold">{money(b.total, biz.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="mt-4">
          <Panel title={`Catégories (${accounts.length})`}>
            {accountsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Chargement...
              </div>
            ) : accounts.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucune catégorie — cliquez sur « Catégorie » pour créer la vôtre.
              </p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2">
                    <StatusPill tone={a.type === "revenu" ? "ok" : "low"}>{a.type === "revenu" ? "Revenu" : "Dépense"}</StatusPill>
                    <span className="flex-1 truncate text-sm font-medium">{a.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => deleteAccountMutation.mutate(a.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase reçu « {deleteTarget?.reference} » ?</AlertDialogTitle>
            <AlertDialogDescription>Aksyon sa a pa ka anile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteReceiptMutation.mutate(deleteTarget.id)}
            >
              Efase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
