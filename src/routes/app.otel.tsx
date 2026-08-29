import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, CalendarPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBiz } from "@/components/gboss/biz-context";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/gboss/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { HOTEL_ADDON_PRICE, money } from "@/lib/gboss/data";
import {
  createHotelUnit,
  createReservation,
  deleteHotelUnit,
  fetchHotelUnits,
  fetchReservations,
  setHotelUnitStatus,
  type HotelUnitInput,
  type HotelUnitRow,
  type ReservationInput,
  type UnitStatus,
} from "@/lib/gboss/hotel";

export const Route = createFileRoute("/app/otel")({
  head: () => ({
    meta: [
      { title: "Airbnb / Hôtel — G-Boss" },
      { name: "description", content: "Gérez chambres, studios et appartements : disponibilité, tarifs et occupation." },
      { property: "og:title", content: "Airbnb / Hôtel — G-Boss" },
      { property: "og:description", content: "Module locatif : unités, capacités, équipements et tarifs par nuit." },
    ],
  }),
  component: Hotel,
});

const STATUS: Record<UnitStatus, { tone: "ok" | "crit" | "low"; label: string }> = {
  libre: { tone: "ok", label: "Libre" },
  occupe: { tone: "crit", label: "Occupé" },
  nettoyage: { tone: "low", label: "Nettoyage" },
};

const EMPTY_FORM: HotelUnitInput = {
  label: "",
  number: "",
  type: "Chambre Simple",
  bedrooms: 1,
  living_room: false,
  kitchen: false,
  bathrooms: 1,
  capacity: 2,
  amenities: [],
  price_per_night: 0,
};

function Hotel() {
  const { biz } = useBiz();
  const queryClient = useQueryClient();

  const unitsQuery = useQuery({
    queryKey: ["hotel-units", biz.id],
    queryFn: () => fetchHotelUnits(biz.id),
    enabled: biz.hotelAddon,
  });
  const units = unitsQuery.data ?? [];
  const occupied = units.filter((u) => u.status === "occupe").length;
  const potential = units.reduce((s, u) => s + u.price_per_night, 0);
  const capacity = units.reduce((s, u) => s + u.capacity, 0);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HotelUnitInput>(EMPTY_FORM);
  const [amenityInput, setAmenityInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<HotelUnitRow | null>(null);

  const reservationsQuery = useQuery({
    queryKey: ["hotel-reservations", biz.id],
    queryFn: () => fetchReservations(biz.id),
    enabled: biz.hotelAddon,
  });
  const reservations = reservationsQuery.data ?? [];

  const EMPTY_RESERVATION: ReservationInput = {
    unit_id: "",
    guest_name: "",
    guest_id_number: null,
    nationality: null,
    adults: 1,
    children: 0,
    checkin: new Date().toISOString().slice(0, 10),
    checkout: new Date().toISOString().slice(0, 10),
    amount_paid: 0,
    agreed_damage_policy: true,
    agreed_noise_policy: true,
  };
  const [resOpen, setResOpen] = useState(false);
  const [resForm, setResForm] = useState<ReservationInput>(EMPTY_RESERVATION);

  const reservationMutation = useMutation({
    mutationFn: async () => {
      if (!resForm.unit_id) throw new Error("Chwazi yon inite.");
      if (!resForm.guest_name.trim()) throw new Error("Antre non kliyan an.");
      await createReservation(biz.id, resForm);
    },
    onSuccess: () => {
      toast.success("Rezèvasyon anrejistre — revni a ajoute nan Kontabilite otomatikman");
      setResOpen(false);
      setResForm(EMPTY_RESERVATION);
      queryClient.invalidateQueries({ queryKey: ["hotel-reservations", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan anrejistreman an"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.label.trim() || !form.number.trim()) throw new Error("Antre non ak nimewo inite a.");
      await createHotelUnit(biz.id, form);
    },
    onSuccess: () => {
      toast.success("Unité ajoutée");
      setOpen(false);
      setForm(EMPTY_FORM);
      setAmenityInput("");
      queryClient.invalidateQueries({ queryKey: ["hotel-units", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur pandan ajoute a"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UnitStatus }) => setHotelUnitStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotel-units", biz.id] }),
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteHotelUnit(id),
    onSuccess: () => {
      toast.success("Unité efase");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["hotel-units", biz.id] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  if (!biz.hotelAddon) {
    return (
      <div>
        <PageHeader title="Airbnb / Hôtel" subtitle={biz.name} />
        <Panel title="Add-on non activé">
          <p className="text-sm text-muted-foreground">
            Le module Airbnb / Hôtel n'est pas activé pour ce business. Activez-le dans Paramètres.
          </p>
        </Panel>
      </div>
    );
  }

  function addAmenity() {
    const v = amenityInput.trim();
    if (!v) return;
    setForm((f) => ({ ...f, amenities: [...f.amenities, v] }));
    setAmenityInput("");
  }

  return (
    <div>
      <PageHeader
        title="Airbnb / Hôtel"
        subtitle={`Add-on locatif · ${money(HOTEL_ADDON_PRICE, "HTG")}/mois · ${units.length} unités`}
        actions={
          <>
          <Dialog open={resOpen} onOpenChange={setResOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <CalendarPlus className="size-4" /> Nouvo rezèvasyon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvo rezèvasyon</DialogTitle>
                <DialogDescription>Montan peye a ajoute otomatikman kòm revni nan Kontabilite.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Inite</Label>
                  <Select value={resForm.unit_id} onValueChange={(v) => setResForm((f) => ({ ...f, unit_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chwazi yon inite" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.label} ({u.number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="r-guest">Non kliyan</Label>
                  <Input id="r-guest" value={resForm.guest_name} onChange={(e) => setResForm((f) => ({ ...f, guest_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-checkin">Check-in</Label>
                  <Input id="r-checkin" type="date" value={resForm.checkin} onChange={(e) => setResForm((f) => ({ ...f, checkin: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-checkout">Check-out</Label>
                  <Input id="r-checkout" type="date" value={resForm.checkout} onChange={(e) => setResForm((f) => ({ ...f, checkout: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-adults">Adilt</Label>
                  <Input id="r-adults" type="number" min={1} value={resForm.adults} onChange={(e) => setResForm((f) => ({ ...f, adults: Number(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-children">Timoun</Label>
                  <Input id="r-children" type="number" min={0} value={resForm.children} onChange={(e) => setResForm((f) => ({ ...f, children: Number(e.target.value) || 0 }))} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="r-paid">Montan peye ({biz.currency})</Label>
                  <Input id="r-paid" type="number" min={0} value={resForm.amount_paid} onChange={(e) => setResForm((f) => ({ ...f, amount_paid: Number(e.target.value) || 0 }))} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => reservationMutation.mutate()} disabled={reservationMutation.isPending}>
                  {reservationMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Anrejistre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" /> Ajouter une unité
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle unité</DialogTitle>
                <DialogDescription>Ajoutée directement à votre inventaire locatif.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="u-label">Nom</Label>
                  <Input id="u-label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-number">Numéro</Label>
                  <Input id="u-number" value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chambre Simple">Chambre Simple</SelectItem>
                      <SelectItem value="Studio">Studio</SelectItem>
                      <SelectItem value="Appartement">Appartement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-price">Prix / nuit ({biz.currency})</Label>
                  <Input
                    id="u-price"
                    type="number"
                    min={0}
                    value={form.price_per_night}
                    onChange={(e) => setForm((f) => ({ ...f, price_per_night: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-bed">Chambres</Label>
                  <Input
                    id="u-bed"
                    type="number"
                    min={0}
                    value={form.bedrooms}
                    onChange={(e) => setForm((f) => ({ ...f, bedrooms: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-bath">Salles de bain</Label>
                  <Input
                    id="u-bath"
                    type="number"
                    min={0}
                    value={form.bathrooms}
                    onChange={(e) => setForm((f) => ({ ...f, bathrooms: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-cap">Capacité (personnes)</Label>
                  <Input
                    id="u-cap"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) || 1 }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                  <Label htmlFor="u-living" className="text-sm">Salon</Label>
                  <Switch id="u-living" checked={form.living_room} onCheckedChange={(v) => setForm((f) => ({ ...f, living_room: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                  <Label htmlFor="u-kitchen" className="text-sm">Cuisine</Label>
                  <Switch id="u-kitchen" checked={form.kitchen} onCheckedChange={(v) => setForm((f) => ({ ...f, kitchen: v }))} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="u-amenity">Équipements</Label>
                  <div className="flex gap-2">
                    <Input
                      id="u-amenity"
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAmenity();
                        }
                      }}
                      placeholder="Ex: Wifi, Climatisation"
                    />
                    <Button type="button" variant="outline" onClick={addAmenity}>
                      Ajouter
                    </Button>
                  </div>
                  {form.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {form.amenities.map((a, i) => (
                        <span key={`${a}-${i}`} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : null}
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
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Unités" value={String(units.length)} tone="blue" icon={<BedDouble className="size-4" />} />
        <KpiCard
          label="Taux d'occupation"
          value={`${Math.round((occupied / Math.max(1, units.length)) * 100)}%`}
          tone="purple"
        />
        <KpiCard label="Capacité totale" value={`${capacity} personnes`} tone="green" />
        <KpiCard label="Revenu potentiel / nuit" value={money(potential, biz.currency)} tone="orange" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {unitsQuery.isLoading ? (
          <Panel title="Unités" className="lg:col-span-3">
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement...
            </div>
          </Panel>
        ) : units.length === 0 ? (
          <Panel title="Unités" className="lg:col-span-3">
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucune unité pour l'instant — cliquez sur « Ajouter une unité ».
            </p>
          </Panel>
        ) : (
          units.map((u) => (
            <article key={u.id} className="gb-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-semibold">{u.label}</h3>
                  <p className="gb-num text-xs text-muted-foreground">
                    {u.number} · {u.type}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusPill tone={STATUS[u.status as UnitStatus].tone}>{STATUS[u.status as UnitStatus].label}</StatusPill>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(u)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <ul className="gb-num mt-3 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                <li>{u.bedrooms} chambre(s)</li>
                <li>{u.bathrooms} salle(s) de bain</li>
                <li>{u.living_room ? "Salon" : "Sans salon"}</li>
                <li>{u.kitchen ? "Cuisine" : "Sans cuisine"}</li>
                <li>Capacité {u.capacity}</li>
              </ul>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium">
                    {a}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="gb-num text-sm font-semibold">
                  {money(u.price_per_night, biz.currency)}
                  <span className="text-xs font-normal text-muted-foreground"> / nuit</span>
                </p>
                <Select
                  value={u.status}
                  onValueChange={(v) => statusMutation.mutate({ id: u.id, status: v as UnitStatus })}
                >
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="libre">Libre</SelectItem>
                    <SelectItem value="occupe">Occupé</SelectItem>
                    <SelectItem value="nettoyage">Nettoyage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </article>
          ))
        )}
      </div>

      <Panel title="Dènye rezèvasyon (Kontabilite)" className="mt-4">
        {reservations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Pa gen rezèvasyon anrejistre ankò.</p>
        ) : (
          <div className="space-y-2.5">
            {reservations.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <CalendarPlus className="size-4 shrink-0 text-kpi-orange" />
                <span className="min-w-0 flex-1 truncate">
                  {r.guest_name} · {r.checkin} → {r.checkout}
                </span>
                <span className="gb-num font-semibold">{money(r.amount_paid, biz.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Efase « {deleteTarget?.label} » ?</AlertDialogTitle>
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
