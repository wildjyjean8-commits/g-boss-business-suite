import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Star, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  setSupplierActive,
  type SupplierInput,
  type SupplierRow,
} from "@/lib/gboss/suppliers";

export const Route = createFileRoute("/app/founise")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — G-Boss" },
      { name: "description", content: "Gérez vos fournisseurs et leurs coordonnées." },
      { property: "og:title", content: "Fournisseurs — G-Boss" },
      { property: "og:description", content: "Annuaire de vos fournisseurs actifs." },
    ],
  }),
  component: Suppliers,
});

const EMPTY_FORM: SupplierInput = { name: "", category: "", contact: "", on_gboss: false };

function Suppliers() {
  const { biz } = useBiz();
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({ queryKey: ["suppliers", biz.id], queryFn: () => fetchSuppliers(biz.id) });
  const list = suppliersQuery.data ?? [];
  const onGBoss = list.filter((x) => x.on_gboss).length;
  const avgRating = list.length ? list.reduce((s, x) => s + (x.rating ?? 0), 0) / list.length : 0;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SupplierInput>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<SupplierRow | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Antre non founisè a.");
      await createSupplier(biz.id, form);
    },
    onSuccess: () => {
      toast.success("Fournisseur ajouté");
      setOpen(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["suppliers", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan ajoute a"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => setSupplierActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers", biz.id] }),
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteSupplier(id),
    onSuccess: () => {
      toast.success("Fournisseur efase");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["suppliers", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        subtitle={`${list.length} fournisseurs · ${biz.name}`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau fournisseur</DialogTitle>
                <DialogDescription>Ajouté directement à votre annuaire fournisseurs.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="s-name">Nom</Label>
                  <Input id="s-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-cat">Catégorie</Label>
                  <Input
                    id="s-cat"
                    value={form.category ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value || null }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-contact">Contact (téléphone/email)</Label>
                  <Input
                    id="s-contact"
                    value={form.contact ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value || null }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                  <Label htmlFor="s-gboss" className="text-sm">
                    Fournisseur présent sur G-Boss
                  </Label>
                  <Switch
                    id="s-gboss"
                    checked={form.on_gboss}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, on_gboss: v }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Fournisseurs actifs" value={String(list.filter((x) => x.active).length)} tone="blue" icon={<Truck className="size-4" />} />
        <KpiCard label="Sur G-Boss" value={String(onGBoss)} tone="purple" hint="commandes directes possibles" />
        <KpiCard label="Total" value={String(list.length)} tone="orange" />
        <KpiCard label="Note moyenne" value={avgRating ? avgRating.toFixed(1) : "—"} tone="green" />
      </div>

      <Panel title="Liste des fournisseurs" className="mt-4">
        {suppliersQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement...
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucun fournisseur pour l'instant — cliquez sur « Ajouter ».
          </p>
        ) : (
          <div className="space-y-3">
            {list.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary font-display text-sm font-bold">
                  {s.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="gb-num truncate text-xs text-muted-foreground">
                    {s.category ?? "—"} · {s.contact ?? "—"}
                  </p>
                </div>
                {s.rating ? (
                  <span className="gb-num flex items-center gap-1 text-xs font-semibold text-gold">
                    <Star className="size-3.5 fill-gold" /> {s.rating.toFixed(1)}
                  </span>
                ) : null}
                <StatusPill tone={s.active ? "ok" : "neutral"}>{s.active ? "Actif" : "Inactif"}</StatusPill>
                {s.on_gboss ? <StatusPill tone="low">Sur G-Boss</StatusPill> : null}
                <Button size="sm" variant="outline" onClick={() => toggleActiveMutation.mutate({ id: s.id, active: !s.active })}>
                  {s.active ? "Désactiver" : "Réactiver"}
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(s)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase « {deleteTarget?.name} » ?</AlertDialogTitle>
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
