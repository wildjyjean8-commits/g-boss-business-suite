import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CheckCircle2, Download, FileImage, Landmark, Loader2, Plus, Printer, Receipt as ReceiptIcon, Search, Trash2, Users2 } from "lucide-react";
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
import { downloadReceiptPdf, printReceipt } from "@/lib/gboss/print-receipt";
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
import {
  createEquityEntry,
  createLiability,
  createPayrollRun,
  fetchBalanceSheet,
  fetchEquityEntries,
  fetchLiabilities,
  fetchPayrollRunItems,
  fetchPayrollRuns,
  markLiabilityPaid,
  processPayrollRun,
  type EquityInput,
  type EquityKind,
  type LiabilityInput,
  type LiabilityKind,
} from "@/lib/gboss/bilan-payroll";

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
const EMPTY_EQUITY: EquityInput = {
  kind: "kapital",
  amount: 0,
  entry_date: new Date().toISOString().slice(0, 10),
  note: "",
};
const EMPTY_LIABILITY: LiabilityInput = {
  kind: "founisè",
  creditor: "",
  amount: 0,
  due_date: null,
  note: "",
};
function currentMonthLabel() {
  return new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function buildReceiptPayload(r: ReceiptRow) {
    const base = {
      businessName: biz.name,
      reference: r.reference,
      currency: biz.currency,
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

  async function handleReprint(r: ReceiptRow) {
    setReprintingId(r.id);
    try {
      printReceipt(await buildReceiptPayload(r));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan chajman resi a");
    } finally {
      setReprintingId(null);
    }
  }

  async function handleDownloadPdf(r: ReceiptRow) {
    setDownloadingId(r.id);
    try {
      await downloadReceiptPdf(await buildReceiptPayload(r));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pandan jenerasyon PDF la");
    } finally {
      setDownloadingId(null);
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

  // ---------- Bilan ----------
  const balanceQuery = useQuery({ queryKey: ["balance-sheet", biz.id], queryFn: () => fetchBalanceSheet(biz.id) });
  const equityQuery = useQuery({ queryKey: ["equity", biz.id], queryFn: () => fetchEquityEntries(biz.id) });
  const liabilitiesQuery = useQuery({ queryKey: ["liabilities", biz.id], queryFn: () => fetchLiabilities(biz.id) });
  const equity = equityQuery.data ?? [];
  const liabilities = liabilitiesQuery.data ?? [];
  const bs = balanceQuery.data;
  const totalActif = bs ? bs.kach + bs.kont_pou_resevwa + bs.valè_estòk : 0;
  const kapitalPwop = bs ? totalActif - bs.pasif_total : 0;

  const [equityOpen, setEquityOpen] = useState(false);
  const [equityForm, setEquityForm] = useState<EquityInput>(EMPTY_EQUITY);
  const [liabilityOpen, setLiabilityOpen] = useState(false);
  const [liabilityForm, setLiabilityForm] = useState<LiabilityInput>(EMPTY_LIABILITY);

  const createEquityMutation = useMutation({
    mutationFn: async () => {
      if (!equityForm.amount || equityForm.amount <= 0) throw new Error("Antre yon montan valab.");
      await createEquityEntry(biz.id, equityForm);
    },
    onSuccess: () => {
      toast.success(equityForm.kind === "kapital" ? "Kapital ajoute" : "Tirad anrejistre");
      setEquityOpen(false);
      setEquityForm(EMPTY_EQUITY);
      queryClient.invalidateQueries({ queryKey: ["equity", biz.id] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const createLiabilityMutation = useMutation({
    mutationFn: async () => {
      if (!liabilityForm.creditor.trim()) throw new Error("Antre non kreditè a.");
      if (!liabilityForm.amount || liabilityForm.amount <= 0) throw new Error("Antre yon montan valab.");
      await createLiability(biz.id, liabilityForm);
    },
    onSuccess: () => {
      toast.success("Dèt/prè anrejistre");
      setLiabilityOpen(false);
      setLiabilityForm(EMPTY_LIABILITY);
      queryClient.invalidateQueries({ queryKey: ["liabilities", biz.id] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => markLiabilityPaid(id),
    onSuccess: () => {
      toast.success("Make kòm peye");
      queryClient.invalidateQueries({ queryKey: ["liabilities", biz.id] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet", biz.id] });
      queryClient.invalidateQueries({ queryKey: ["receipts", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  // ---------- Payroll ----------
  const payrollRunsQuery = useQuery({ queryKey: ["payroll-runs", biz.id], queryFn: () => fetchPayrollRuns(biz.id) });
  const payrollRuns = payrollRunsQuery.data ?? [];
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [periodLabel, setPeriodLabel] = useState(currentMonthLabel());
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [confirmRunId, setConfirmRunId] = useState<string | null>(null);

  const runItemsQuery = useQuery({
    queryKey: ["payroll-items", openRunId],
    queryFn: () => fetchPayrollRunItems(openRunId as string),
    enabled: !!openRunId,
  });
  const runItems = runItemsQuery.data ?? [];
  const openRun = payrollRuns.find((r) => r.id === openRunId) ?? null;

  const createPayrollMutation = useMutation({
    mutationFn: async () => {
      if (!periodLabel.trim()) throw new Error("Antre yon peryòd (ex: Septanm 2026).");
      const { start, end } = monthBounds();
      return createPayrollRun(biz.id, { period_label: periodLabel, period_start: start, period_end: end });
    },
    onSuccess: (runId) => {
      toast.success("Payroll kreye");
      setPayrollOpen(false);
      setPeriodLabel(currentMonthLabel());
      queryClient.invalidateQueries({ queryKey: ["payroll-runs", biz.id] });
      setOpenRunId(runId);
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const processPayrollMutation = useMutation({
    mutationFn: async (runId: string) => processPayrollRun(runId),
    onSuccess: () => {
      toast.success("Peman fèt — chak anplwaye gen yon resi nan Bibliyotèk Resi");
      setConfirmRunId(null);
      queryClient.invalidateQueries({ queryKey: ["payroll-runs", biz.id] });
      queryClient.invalidateQueries({ queryKey: ["receipts", biz.id] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet", biz.id] });
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
          <TabsTrigger value="bilan">Bilan</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Imprimer"
                              disabled={reprintingId === r.id}
                              onClick={() => handleReprint(r)}
                            >
                              {reprintingId === r.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Printer className="size-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Télécharger PDF"
                              disabled={downloadingId === r.id}
                              onClick={() => handleDownloadPdf(r)}
                            >
                              {downloadingId === r.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Download className="size-4" />
                              )}
                            </Button>
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

        <TabsContent value="bilan" className="mt-4 space-y-4">
          {balanceQuery.isLoading || !bs ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chajman...
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Aktif">
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Kach</span>
                    <span className="gb-num font-semibold">{money(bs.kach, biz.currency)}</span>
                  </li>
                  <li className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Kont pou Resevwa</span>
                    <span className="gb-num font-semibold">{money(bs.kont_pou_resevwa, biz.currency)}</span>
                  </li>
                  {biz.stockEnabled ? (
                    <li className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Valè Estòk</span>
                      <span className="gb-num font-semibold">{money(bs.valè_estòk, biz.currency)}</span>
                    </li>
                  ) : null}
                  <li className="flex justify-between pb-1">
                    <span className="font-semibold">Total Aktif</span>
                    <span className="gb-num font-bold text-kpi-blue">{money(totalActif, biz.currency)}</span>
                  </li>
                </ul>
              </Panel>

              <Panel title="Pasif & Kapital Pwòp">
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Pasif total (dèt an atant)</span>
                    <span className="gb-num font-semibold text-kpi-orange">{money(bs.pasif_total, biz.currency)}</span>
                  </li>
                  <li className="flex justify-between pb-1">
                    <span className="font-semibold">Kapital Pwòp</span>
                    <span className={`gb-num font-bold ${kapitalPwop >= 0 ? "text-kpi-green" : "text-kpi-red"}`}>
                      {money(kapitalPwop, biz.currency)}
                    </span>
                  </li>
                  <li className="flex justify-between text-xs text-muted-foreground">
                    <span>dont Kapital enjekte</span>
                    <span className="gb-num">{money(bs.kapital_enjekte, biz.currency)}</span>
                  </li>
                  <li className="flex justify-between text-xs text-muted-foreground">
                    <span>dont Tirad</span>
                    <span className="gb-num">−{money(bs.tirad_total, biz.currency)}</span>
                  </li>
                </ul>
              </Panel>

              <Panel
                title="Mouvman Kapital"
                action={
                  <Dialog open={equityOpen} onOpenChange={setEquityOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="size-4" /> Kapital / Tirad
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouvo mouvman kapital</DialogTitle>
                        <DialogDescription>Kapital enjekte ogmante Kach ou; Tirad diminye l.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Tip</Label>
                          <Select
                            value={equityForm.kind}
                            onValueChange={(v) => setEquityForm((f) => ({ ...f, kind: v as EquityKind }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kapital">Kapital enjekte</SelectItem>
                              <SelectItem value="tirad">Tirad pwopriyetè</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="e-amount">Montan ({biz.currency})</Label>
                            <Input
                              id="e-amount"
                              type="number"
                              min={0}
                              value={equityForm.amount}
                              onChange={(e) => setEquityForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="e-date">Dat</Label>
                            <Input
                              id="e-date"
                              type="date"
                              value={equityForm.entry_date}
                              onChange={(e) => setEquityForm((f) => ({ ...f, entry_date: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="e-note">Nòt (opsyonèl)</Label>
                          <Input
                            id="e-note"
                            value={equityForm.note ?? ""}
                            onChange={(e) => setEquityForm((f) => ({ ...f, note: e.target.value || null }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => createEquityMutation.mutate()} disabled={createEquityMutation.isPending}>
                          {createEquityMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                          Anrejistre
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                }
              >
                {equity.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Okenn mouvman kapital pou kounye a.</p>
                ) : (
                  <ul className="space-y-2">
                    {equity.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                        <StatusPill tone={e.kind === "kapital" ? "ok" : "low"}>
                          {e.kind === "kapital" ? "Kapital" : "Tirad"}
                        </StatusPill>
                        <span className="flex-1 truncate text-muted-foreground">{e.note || "—"}</span>
                        <span className="gb-num text-xs text-muted-foreground">{e.entry_date}</span>
                        <span className="gb-num font-semibold">{money(e.amount, biz.currency)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel
                title="Dèt ak Prè"
                action={
                  <Dialog open={liabilityOpen} onOpenChange={setLiabilityOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="size-4" /> Dèt
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouvo dèt / prè</DialogTitle>
                        <DialogDescription>Yon fwa ou make l "peye", li kreye yon resi depans otomatikman.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Kalite</Label>
                          <Select
                            value={liabilityForm.kind}
                            onValueChange={(v) => setLiabilityForm((f) => ({ ...f, kind: v as LiabilityKind }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="prè_bankè">Prè bankè</SelectItem>
                              <SelectItem value="founisè">Kont founisè</SelectItem>
                              <SelectItem value="lòt">Lòt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="l-creditor">Kreditè</Label>
                          <Input
                            id="l-creditor"
                            value={liabilityForm.creditor}
                            onChange={(e) => setLiabilityForm((f) => ({ ...f, creditor: e.target.value }))}
                            placeholder="Ex: Sogebank, Founisè XYZ"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="l-amount">Montan ({biz.currency})</Label>
                            <Input
                              id="l-amount"
                              type="number"
                              min={0}
                              value={liabilityForm.amount}
                              onChange={(e) => setLiabilityForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="l-due">Echeans (opsyonèl)</Label>
                            <Input
                              id="l-due"
                              type="date"
                              value={liabilityForm.due_date ?? ""}
                              onChange={(e) => setLiabilityForm((f) => ({ ...f, due_date: e.target.value || null }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="l-note">Nòt (opsyonèl)</Label>
                          <Input
                            id="l-note"
                            value={liabilityForm.note ?? ""}
                            onChange={(e) => setLiabilityForm((f) => ({ ...f, note: e.target.value || null }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => createLiabilityMutation.mutate()} disabled={createLiabilityMutation.isPending}>
                          {createLiabilityMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                          Anrejistre
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                }
              >
                {liabilities.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Okenn dèt/prè anrejistre.</p>
                ) : (
                  <ul className="space-y-2">
                    {liabilities.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                        <Landmark className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">
                          <span className="font-medium">{l.creditor}</span>
                          <span className="text-muted-foreground"> · {l.kind === "prè_bankè" ? "Prè bankè" : l.kind === "founisè" ? "Kont founisè" : "Lòt"}</span>
                        </span>
                        <span className="gb-num font-semibold">{money(l.amount, biz.currency)}</span>
                        <StatusPill tone={l.status === "peye" ? "ok" : "low"}>
                          {l.status === "peye" ? "Peye" : "An atant"}
                        </StatusPill>
                        {l.status === "an_atant" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markPaidMutation.mutate(l.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            <CheckCircle2 className="size-4" /> Make peye
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payroll" className="mt-4 space-y-4">
          <Panel
            title="Payroll"
            action={
              <Dialog open={payrollOpen} onOpenChange={setPayrollOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" /> Nouvo Payroll
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvo payroll</DialogTitle>
                    <DialogDescription>
                      Kreye yon woulman brouyon ak tout anplwaye aktif ki gen yon salè defini nan Ekip.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="p-period">Peryòd</Label>
                      <Input
                        id="p-period"
                        value={periodLabel}
                        onChange={(e) => setPeriodLabel(e.target.value)}
                        placeholder="Ex: Septanm 2026"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => createPayrollMutation.mutate()} disabled={createPayrollMutation.isPending}>
                      {createPayrollMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Kreye
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          >
            {payrollRunsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Chajman...
              </div>
            ) : payrollRuns.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Okenn payroll ankò — ajoute yon salè nan pwofil chak anplwaye (Ekip) pou kòmanse Payroll.
              </p>
            ) : (
              <ul className="space-y-2">
                {payrollRuns.map((r) => (
                  <li key={r.id} className="rounded-lg bg-secondary px-3 py-2.5 text-sm">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 text-left"
                      onClick={() => setOpenRunId(openRunId === r.id ? null : r.id)}
                    >
                      <Banknote className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 font-medium">{r.period_label}</span>
                      <span className="gb-num font-semibold">{money(r.total_amount, biz.currency)}</span>
                      <StatusPill tone={r.status === "trete" ? "ok" : "neutral"}>
                        {r.status === "trete" ? "Trete" : "Brouyon"}
                      </StatusPill>
                    </button>

                    {openRunId === r.id ? (
                      <div className="mt-3 border-t border-border pt-3">
                        {runItemsQuery.isLoading ? (
                          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" /> Chajman anplwaye...
                          </div>
                        ) : runItems.length === 0 ? (
                          <p className="py-4 text-center text-xs text-muted-foreground">Okenn anplwaye nan woulman sa a.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {runItems.map((it) => (
                              <li key={it.id} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <Users2 className="size-3.5" /> {it.member_name}
                                </span>
                                <span className="gb-num font-medium text-foreground">{money(it.salary, biz.currency)}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {r.status === "brouyon" ? (
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" onClick={() => setConfirmRunId(r.id)}>
                              Trete Payroll
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-kpi-green">
                            Peye — chak anplwaye gen yon resi nan Bibliyotèk Resi.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmRunId} onOpenChange={(v) => !v && setConfirmRunId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trete payroll sa a?</AlertDialogTitle>
            <AlertDialogDescription>
              Sa a ap kreye yon peman reyèl pou chak anplwaye epi jenere yon resi depans otomatikman. Aksyon sa a pa ka anile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annile</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRunId && processPayrollMutation.mutate(confirmRunId)}
              disabled={processPayrollMutation.isPending}
            >
              {processPayrollMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Trete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
