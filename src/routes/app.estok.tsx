import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, ProgressBar, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { money, SECTOR_CATEGORIES } from "@/lib/gboss/data";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  productStockMetrics,
  productStockStatus,
  updateProduct,
  type ProductInput,
  type ProductRow,
} from "@/lib/gboss/products";

export const Route = createFileRoute("/app/estok")({
  head: () => ({
    meta: [
      { title: "Stock & Market — G-Boss" },
      { name: "description", content: "Suivez vos produits, niveaux minimum, alertes et valeur de stock par catégorie." },
      { property: "og:title", content: "Stock & Market — G-Boss" },
      { property: "og:description", content: "Produits, alertes de rupture et valeur du stock." },
    ],
  }),
  component: Stock,
});

const EMPTY_FORM: ProductInput = {
  sku: "",
  name: "",
  category: null,
  price: 0,
  cost: 0,
  stock: 0,
  min_stock: 0,
};

function Stock() {
  const { biz } = useBiz();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products", biz.id],
    queryFn: () => fetchProducts(biz.id),
  });
  const products = productsQuery.data ?? [];
  const m = productStockMetrics(products);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const categories = SECTOR_CATEGORIES[biz.sector] ?? m.categories.map((c) => c.name);

  const rows = useMemo(
    () =>
      products.filter(
        (p) =>
          (!cat || p.category === cat) &&
          (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())),
      ),
    [products, cat, q],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      min_stock: p.min_stock,
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.sku.trim() || !form.name.trim()) {
        throw new Error("SKU ak non pwodwi a obligatwa");
      }
      if (editing) {
        await updateProduct(editing.id, form);
      } else {
        await createProduct(biz.id, form);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Pwodwi modifye" : "Pwodwi ajoute");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products", biz.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur pandan anrejistreman an");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Pwodwi efase");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["products", biz.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur pandan efasman an");
    },
  });

  return (
    <div>
      <PageHeader
        title="Stock / Market"
        subtitle={`Catégories pré-remplies selon le secteur : ${biz.sector}`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" /> Ajouter un produit
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Valeur (coût)" value={money(m.value, biz.currency)} tone="blue" />
        <KpiCard label="Valeur (vente)" value={money(m.retail, biz.currency)} tone="green" />
        <KpiCard label="Unités en stock" value={String(m.units)} tone="purple" hint={`${m.total} produits`} />
        <KpiCard label="Alertes" value={String(m.low.length)} tone={m.low.length ? "red" : "green"} hint="sous le minimum" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher produit ou SKU" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={cat === null ? "default" : "outline"} size="sm" onClick={() => setCat(null)}>
            Toutes
          </Button>
          {categories.map((c) => (
            <Button key={c} variant={cat === c ? "default" : "outline"} size="sm" onClick={() => setCat(c)}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      <Panel title={`Produits (${rows.length})`} className="mt-4">
        {productsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement des produits...
          </div>
        ) : productsQuery.isError ? (
          <p className="py-10 text-center text-sm text-destructive">
            Impossible de charger les produits. Réessayez.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {products.length === 0
              ? "Aucun produit pour l'instant — cliquez sur « Ajouter un produit »."
              : "Aucun produit ne correspond à votre recherche."}
          </p>
        ) : (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="gb-label py-2">SKU</th>
                  <th className="gb-label py-2">Produit</th>
                  <th className="gb-label py-2">Catégorie</th>
                  <th className="gb-label py-2 text-right">Prix</th>
                  <th className="gb-label py-2 text-right">Stock</th>
                  <th className="gb-label py-2">Niveau</th>
                  <th className="gb-label py-2 text-right">Statut</th>
                  <th className="gb-label py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const st = productStockStatus(p);
                  return (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="gb-num py-2.5 text-muted-foreground">{p.sku}</td>
                      <td className="py-2.5 font-medium">{p.name}</td>
                      <td className="py-2.5 text-muted-foreground">{p.category ?? "—"}</td>
                      <td className="gb-num py-2.5 text-right">{money(p.price, biz.currency)}</td>
                      <td className="gb-num py-2.5 text-right font-semibold">{p.stock}</td>
                      <td className="w-32 py-2.5">
                        <ProgressBar
                          value={(p.stock / Math.max(1, p.min_stock * 2)) * 100}
                          tone={st === "ok" ? "green" : st === "low" ? "orange" : "red"}
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        <StatusPill tone={st}>{st === "ok" ? "OK" : st === "low" ? "Bas" : "Critique"}</StatusPill>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(p)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
            <DialogDescription>
              Les valeurs sont enregistrées directement dans votre stock — pas de démonstration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-name">Nom du produit</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Sak siman"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-sku">SKU</Label>
              <Input
                id="p-sku"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="Ex: RST-0001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Catégorie</Label>
              <Input
                id="p-cat"
                list="category-suggestions"
                value={form.category ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value || null }))}
                placeholder="Ex: Matériaux de base"
              />
              <datalist id="category-suggestions">
                {(SECTOR_CATEGORIES[biz.sector] ?? []).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Prix de vente ({biz.currency})</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cost">Coût ({biz.currency})</Label>
              <Input
                id="p-cost"
                type="number"
                min={0}
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Stock actuel</Label>
              <Input
                id="p-stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-min">Stock minimum</Label>
              <Input
                id="p-min"
                type="number"
                min={0}
                value={form.min_stock}
                onChange={(e) => setForm((f) => ({ ...f, min_stock: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {editing ? "Enregistrer les modifications" : "Ajouter le produit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase « {deleteTarget?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksyon sa a pa ka anile. Pwodwi a ap disparèt nèt nan stock ou.
            </AlertDialogDescription>
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
