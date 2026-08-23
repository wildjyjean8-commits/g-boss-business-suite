/**
 * Jeu de données de démonstration G-Boss.
 * Toutes les valeurs affichées dans l'app (KPI, graphiques, tableaux) sont
 * dérivées de ces enregistrements — aucun chiffre n'est codé en dur dans l'UI.
 * Pas d'aléatoire ni d'I/O au niveau module (contrainte runtime serveur).
 */

export type PlanId = "esansyel" | "estanda" | "premyom" | "kanpis";

export const PLANS: Record<PlanId, { name: string; price: number; unit: string; seats: number }> = {
  esansyel: { name: "G-Esansyèl", price: 350, unit: "HTG/mois", seats: 1 },
  estanda: { name: "G-Estanda", price: 630, unit: "HTG/mois", seats: 5 },
  premyom: { name: "G-Premyòm", price: 1050, unit: "HTG/mois", seats: 20 },
  kanpis: { name: "G-Kanpis", price: 75, unit: "HTG/mois / élève", seats: 0 },
};

export const HOTEL_ADDON_PRICE = 1000;
export const MULTI_BUSINESS_SURCHARGE = 0.3; // +30% pour 2 business
export const MAX_BUSINESSES = 2;
export const TRIAL_DAYS = 8;
export const OFFLINE_GRACE_DAYS = 7;
export const VERIFICATION_CODE_MINUTES = 30;
export const SUPER_ADMIN_EMAIL = "wildjyjean8@gmail.com";

export const SECTORS = [
  "Restaurant",
  "Boutique / Détail",
  "Construction / Matériaux",
  "Salon de beauté",
  "Services professionnels",
  "Automobile",
  "Santé",
  "Autre",
] as const;

export const SECTOR_CATEGORIES: Record<string, string[]> = {
  Restaurant: ["Nourriture", "Boissons", "Matériel cuisine"],
  "Boutique / Détail": ["Vêtements", "Accessoires", "Divers"],
  "Construction / Matériaux": ["Matériaux de base", "Outils", "Finition"],
  "Salon de beauté": ["Produits capillaires", "Soins", "Matériel"],
  "Services professionnels": ["Fournitures bureau", "Licences", "Divers"],
  Automobile: ["Pièces", "Lubrifiants", "Accessoires"],
  Santé: ["Médicaments", "Consommables", "Équipement"],
  Autre: ["Catégorie 1", "Catégorie 2"],
};

export const ROLES = [
  "Admin Principal",
  "Manager",
  "Employé Standard",
  "Vendeur/Caissier",
  "Comptable",
  "Professeur",
] as const;

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  min: number;
  supplier: string;
  sold: number;
};

export type Invoice = {
  id: string;
  client: string;
  amount: number;
  status: "paye" | "attente" | "expire";
  date: string;
  due: string;
};

export type Task = {
  id: string;
  title: string;
  status: "afe" | "ankou" | "revizyon" | "bloke" | "fini";
  priority: "haute" | "moyenne" | "basse";
  assignee: string | null;
  due: string;
  progress: number;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  active: boolean;
  tasksDone: number;
  tasksTotal: number;
  phone: string;
  present: boolean;
};

export type Supplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  rating: number;
  onGBoss: boolean;
  pending: number;
  purchases: number;
  active: boolean;
};

export type DayPoint = { day: string; revenue: number; expense: number; orders: number };

export type Unit = {
  id: string;
  label: string;
  number: string;
  type: "Chambre Simple" | "Studio" | "Appartement";
  bedrooms: number;
  livingRoom: boolean;
  kitchen: boolean;
  bathrooms: number;
  capacity: number;
  amenities: string[];
  pricePerNight: number;
  status: "libre" | "occupe" | "nettoyage";
};

export type Student = {
  id: string;
  name: string;
  classroom: string;
  average: number;
  attendance: number;
  status: "actif" | "restreint";
  guardian: string;
};

export type Business = {
  id: string;
  name: string;
  sector: string;
  plan: PlanId;
  currency: "HTG" | "USD";
  rate: number;
  posEnabled: boolean;
  stockEnabled: boolean;
  hotelAddon: boolean;
  schoolAddon: boolean;
  taxRate: number;
  legalName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  logoUrl: string | null;
  products: Product[];
  invoices: Invoice[];
  tasks: Task[];
  employees: Employee[];
  suppliers: Supplier[];
  week: DayPoint[];
  units: Unit[];
  students: Student[];
};

const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function week(base: number, spread: number[]): DayPoint[] {
  return days.map((day, i) => ({
    day,
    revenue: base + (spread[i] ?? 0) * 100,
    expense: Math.round((base + (spread[i] ?? 0) * 100) * 0.58),
    orders: 8 + ((spread[i] ?? 0) % 11),
  }));
}

export const BUSINESSES: Business[] = [
  {
    id: "biz-resto",
    name: "Ti Bwat Restaurant",
    sector: "Restaurant",
    plan: "estanda",
    currency: "HTG",
    rate: 132,
    posEnabled: true,
    stockEnabled: true,
    hotelAddon: true,
    schoolAddon: false,
    taxRate: 10,
    legalName: null,
    address: null,
    phone: null,
    email: null,
    taxNumber: null,
    logoUrl: null,
    products: [
      { id: "p1", sku: "RST-0001", name: "Griyo pòsyon", category: "Nourriture", price: 750, cost: 420, stock: 42, min: 15, supplier: "Distribisyon Nò", sold: 186 },
      { id: "p2", sku: "RST-0002", name: "Diri kole", category: "Nourriture", price: 350, cost: 180, stock: 12, min: 20, supplier: "Distribisyon Nò", sold: 240 },
      { id: "p3", sku: "RST-0003", name: "Jus natirèl 1L", category: "Boissons", price: 250, cost: 120, stock: 4, min: 18, supplier: "Boisson Plus", sold: 312 },
      { id: "p4", sku: "RST-0004", name: "Kola 500ml", category: "Boissons", price: 100, cost: 55, stock: 96, min: 30, supplier: "Boisson Plus", sold: 520 },
      { id: "p5", sku: "RST-0005", name: "Gaz kwizin 25lb", category: "Matériel cuisine", price: 3200, cost: 2600, stock: 6, min: 4, supplier: "EnerjiKay", sold: 18 },
    ],
    invoices: [
      { id: "FA-1042", client: "Hotel Marabou", amount: 48500, status: "paye", date: "2026-08-02", due: "2026-08-12" },
      { id: "FA-1043", client: "Ecole Sainte-Rose", amount: 21750, status: "attente", date: "2026-08-05", due: "2026-08-20" },
      { id: "FA-1044", client: "Digicel Event", amount: 96000, status: "attente", date: "2026-08-07", due: "2026-08-22" },
      { id: "FA-1045", client: "Boulanjri Elit", amount: 13400, status: "expire", date: "2026-07-11", due: "2026-07-25" },
      { id: "FA-1046", client: "Kafe Lakay", amount: 32900, status: "paye", date: "2026-08-09", due: "2026-08-19" },
    ],
    tasks: [
      { id: "T-1", title: "Kòmande pwovizyon semèn nan", status: "afe", priority: "haute", assignee: "Mirlande J.", due: "2026-08-15", progress: 0 },
      { id: "T-2", title: "Inventè frigidè", status: "ankou", priority: "moyenne", assignee: "Ronald P.", due: "2026-08-14", progress: 45 },
      { id: "T-3", title: "Fòmasyon nouvo sèvè", status: "ankou", priority: "basse", assignee: "Kettia L.", due: "2026-08-18", progress: 70 },
      { id: "T-4", title: "Reparasyon frizè 2", status: "bloke", priority: "haute", assignee: null, due: "2026-08-13", progress: 20 },
      { id: "T-5", title: "Menu mwa Out", status: "revizyon", priority: "moyenne", assignee: "Mirlande J.", due: "2026-08-16", progress: 90 },
      { id: "T-6", title: "Peye founisè Boisson Plus", status: "fini", priority: "haute", assignee: "Jean W.", due: "2026-08-10", progress: 100 },
      { id: "T-7", title: "Netwayaj gwo kwizin", status: "fini", priority: "basse", assignee: "Ronald P.", due: "2026-08-09", progress: 100 },
    ],
    employees: [
      { id: "E-1", name: "Mirlande Joseph", role: "Manager", department: "Opérations", active: true, tasksDone: 14, tasksTotal: 18, phone: "+509 3712 0011", present: true },
      { id: "E-2", name: "Ronald Pierre", role: "Employé Standard", department: "Cuisine", active: true, tasksDone: 9, tasksTotal: 15, phone: "+509 3712 0022", present: true },
      { id: "E-3", name: "Kettia Louis", role: "Vendeur/Caissier", department: "Salle", active: true, tasksDone: 11, tasksTotal: 12, phone: "+509 3712 0033", present: false },
      { id: "E-4", name: "Jean Wildjy", role: "Admin Principal", department: "Direction", active: true, tasksDone: 20, tasksTotal: 22, phone: "+509 3712 0044", present: true },
      { id: "E-5", name: "Samuel Cadet", role: "Comptable", department: "Finances", active: false, tasksDone: 5, tasksTotal: 10, phone: "+509 3712 0055", present: false },
    ],
    suppliers: [
      { id: "S-1", name: "Distribisyon Nò", category: "Nourriture", contact: "+509 2811 4400", rating: 4.6, onGBoss: true, pending: 18400, purchases: 246000, active: true },
      { id: "S-2", name: "Boisson Plus", category: "Boissons", contact: "+509 2811 5500", rating: 4.2, onGBoss: false, pending: 0, purchases: 158000, active: true },
      { id: "S-3", name: "EnerjiKay", category: "Matériel cuisine", contact: "+509 2811 6600", rating: 3.8, onGBoss: false, pending: 32000, purchases: 89000, active: true },
    ],
    week: week(9400, [3, 7, 5, 11, 14, 19, 8]),
    units: [
      { id: "U-1", label: "Studio Palmiste", number: "A-101", type: "Studio", bedrooms: 1, livingRoom: true, kitchen: true, bathrooms: 1, capacity: 2, amenities: ["WiFi", "Inverter", "Clim"], pricePerNight: 4500, status: "occupe" },
      { id: "U-2", label: "Chambre Kanpèch", number: "A-102", type: "Chambre Simple", bedrooms: 1, livingRoom: false, kitchen: false, bathrooms: 1, capacity: 2, amenities: ["WiFi", "Ventilateur"], pricePerNight: 2500, status: "libre" },
      { id: "U-3", label: "Appartement Cocotier", number: "B-201", type: "Appartement", bedrooms: 3, livingRoom: true, kitchen: true, bathrooms: 2, capacity: 6, amenities: ["WiFi", "Inverter", "Clim", "Parking"], pricePerNight: 9500, status: "nettoyage" },
    ],
    students: [],
  },
  {
    id: "biz-konstriksyon",
    name: "JW Konstriksyon",
    sector: "Construction / Matériaux",
    plan: "premyom",
    currency: "USD",
    rate: 132,
    posEnabled: false,
    stockEnabled: true,
    hotelAddon: false,
    schoolAddon: false,
    taxRate: 0,
    legalName: null,
    address: null,
    phone: null,
    email: null,
    taxNumber: null,
    logoUrl: null,
    products: [
      { id: "c1", sku: "CST-0001", name: "Sak siman", category: "Matériaux de base", price: 620, cost: 540, stock: 240, min: 100, supplier: "Sima Ayiti", sold: 1200 },
      { id: "c2", sku: "CST-0002", name: "Blòk 8", category: "Matériaux de base", price: 95, cost: 72, stock: 60, min: 150, supplier: "Blòk Delmas", sold: 3400 },
      { id: "c3", sku: "CST-0003", name: "Trwèl", category: "Outils", price: 850, cost: 610, stock: 18, min: 10, supplier: "Zouti Pro", sold: 45 },
      { id: "c4", sku: "CST-0004", name: "Penti 5gal", category: "Finition", price: 5400, cost: 4200, stock: 9, min: 12, supplier: "Zouti Pro", sold: 82 },
    ],
    invoices: [
      { id: "FA-2011", client: "Résidence Belvédère", amount: 412000, status: "attente", date: "2026-08-01", due: "2026-08-30" },
      { id: "FA-2012", client: "Mairie de Pétion-Ville", amount: 890000, status: "paye", date: "2026-07-20", due: "2026-08-05" },
      { id: "FA-2013", client: "Groupe Solèy", amount: 156000, status: "expire", date: "2026-06-28", due: "2026-07-15" },
    ],
    tasks: [
      { id: "K-1", title: "Devis chantier Belvédère", status: "ankou", priority: "haute", assignee: "Peterson D.", due: "2026-08-15", progress: 60 },
      { id: "K-2", title: "Livraison blòk site 3", status: "afe", priority: "haute", assignee: null, due: "2026-08-14", progress: 0 },
      { id: "K-3", title: "Rapport sécurité", status: "revizyon", priority: "moyenne", assignee: "Naomie C.", due: "2026-08-17", progress: 80 },
      { id: "K-4", title: "Paiement Sima Ayiti", status: "fini", priority: "haute", assignee: "Naomie C.", due: "2026-08-08", progress: 100 },
    ],
    employees: [
      { id: "F-1", name: "Peterson Dorvil", role: "Manager", department: "Chantier", active: true, tasksDone: 12, tasksTotal: 16, phone: "+509 3900 1122", present: true },
      { id: "F-2", name: "Naomie Charles", role: "Comptable", department: "Finances", active: true, tasksDone: 8, tasksTotal: 9, phone: "+509 3900 3344", present: true },
      { id: "F-3", name: "Jean Wildjy", role: "Admin Principal", department: "Direction", active: true, tasksDone: 15, tasksTotal: 20, phone: "+509 3712 0044", present: true },
    ],
    suppliers: [
      { id: "SC-1", name: "Sima Ayiti", category: "Matériaux de base", contact: "+509 2255 0099", rating: 4.9, onGBoss: true, pending: 210000, purchases: 1850000, active: true },
      { id: "SC-2", name: "Blòk Delmas", category: "Matériaux de base", contact: "+509 2255 1188", rating: 4.1, onGBoss: false, pending: 0, purchases: 640000, active: true },
      { id: "SC-3", name: "Zouti Pro", category: "Outils", contact: "+509 2255 2277", rating: 4.4, onGBoss: false, pending: 48000, purchases: 320000, active: false },
    ],
    week: week(21000, [12, 4, 9, 16, 6, 2, 1]),
    units: [],
    students: [
      { id: "ST-1", name: "Wideline Étienne", classroom: "Tech. Bâtiment 1", average: 14.6, attendance: 92, status: "actif", guardian: "M. Étienne" },
      { id: "ST-2", name: "Frantz Alcé", classroom: "Tech. Bâtiment 1", average: 11.2, attendance: 78, status: "restreint", guardian: "Mme Alcé" },
    ],
  },
];

export function getBusiness(id: string): Business {
  return BUSINESSES.find((b) => b.id === id) ?? (BUSINESSES[0] as Business);
}

export function planPrice(plan: PlanId, businesses: number, hotelAddon: boolean, students = 0) {
  const base = plan === "kanpis" ? PLANS.kanpis.price * students : PLANS[plan].price;
  const multi = businesses > 1 ? base * (1 + MULTI_BUSINESS_SURCHARGE) : base;
  return Math.round(multi + (hotelAddon ? HOTEL_ADDON_PRICE : 0));
}

export function money(amount: number, currency: "HTG" | "USD" = "HTG") {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} ${currency}`;
}

/* ---------- Agrégations ---------- */

export function stockStatus(p: Product): "ok" | "low" | "crit" {
  if (p.stock <= p.min * 0.35) return "crit";
  if (p.stock < p.min) return "low";
  return "ok";
}

export function stockMetrics(b: Business) {
  const value = b.products.reduce((s, p) => s + p.stock * p.cost, 0);
  const retail = b.products.reduce((s, p) => s + p.stock * p.price, 0);
  const low = b.products.filter((p) => stockStatus(p) !== "ok");
  const units = b.products.reduce((s, p) => s + p.stock, 0);
  const categories = Array.from(new Set(b.products.map((p) => p.category))).map((name) => ({
    name,
    count: b.products.filter((p) => p.category === name).length,
    value: b.products.filter((p) => p.category === name).reduce((s, p) => s + p.stock * p.cost, 0),
  }));
  return { value, retail, low, units, categories, total: b.products.length };
}

export function invoiceMetrics(b: Business) {
  const total = b.invoices.reduce((s, i) => s + i.amount, 0);
  const paid = b.invoices.filter((i) => i.status === "paye").reduce((s, i) => s + i.amount, 0);
  const pending = b.invoices.filter((i) => i.status === "attente").reduce((s, i) => s + i.amount, 0);
  const expired = b.invoices.filter((i) => i.status === "expire").reduce((s, i) => s + i.amount, 0);
  const month = b.invoices.filter((i) => i.date.startsWith("2026-08")).reduce((s, i) => s + i.amount, 0);
  return { total, paid, pending, expired, month };
}

export function weekMetrics(b: Business) {
  const revenue = b.week.reduce((s, d) => s + d.revenue, 0);
  const expense = b.week.reduce((s, d) => s + d.expense, 0);
  const orders = b.week.reduce((s, d) => s + d.orders, 0);
  return { revenue, expense, profit: revenue - expense, orders };
}

export function taskMetrics(b: Business) {
  const by = (s: Task["status"]) => b.tasks.filter((t) => t.status === s);
  return {
    total: b.tasks.length,
    todo: by("afe"),
    doing: by("ankou"),
    review: by("revizyon"),
    blocked: by("bloke"),
    done: by("fini"),
    unassigned: b.tasks.filter((t) => !t.assignee).length,
  };
}

/* ---------- Données plateforme (Super-Admin) ---------- */

export type PlatformAccount = {
  id: string;
  name: string;
  sector: string;
  plan: PlanId;
  addonHotel: boolean;
  businesses: number;
  students: number;
  joined: string;
  status: "actif" | "essai" | "restreint" | "annule";
  paidOnTime: boolean;
};

export const PLATFORM_ACCOUNTS: PlatformAccount[] = [
  { id: "AC-001", name: "Ti Bwat Restaurant", sector: "Restaurant", plan: "estanda", addonHotel: true, businesses: 2, students: 0, joined: "2026-02-11", status: "actif", paidOnTime: true },
  { id: "AC-002", name: "JW Konstriksyon", sector: "Construction / Matériaux", plan: "premyom", addonHotel: false, businesses: 1, students: 0, joined: "2026-03-02", status: "actif", paidOnTime: true },
  { id: "AC-003", name: "Boutik Lakay", sector: "Boutique / Détail", plan: "esansyel", addonHotel: false, businesses: 1, students: 0, joined: "2026-04-19", status: "essai", paidOnTime: true },
  { id: "AC-004", name: "Institut Sainte-Rose", sector: "Institution", plan: "kanpis", addonHotel: false, businesses: 1, students: 240, joined: "2026-01-25", status: "actif", paidOnTime: false },
  { id: "AC-005", name: "Garaj Delmas 33", sector: "Automobile", plan: "estanda", addonHotel: false, businesses: 1, students: 0, joined: "2026-05-06", status: "restreint", paidOnTime: false },
  { id: "AC-006", name: "Salon Belle Vue", sector: "Salon de beauté", plan: "esansyel", addonHotel: false, businesses: 1, students: 0, joined: "2026-05-28", status: "annule", paidOnTime: false },
  { id: "AC-007", name: "Kay Repo Guest House", sector: "Services professionnels", plan: "premyom", addonHotel: true, businesses: 2, students: 0, joined: "2026-06-14", status: "actif", paidOnTime: true },
  { id: "AC-008", name: "Centre Pwofesyonèl Nò", sector: "Institution", plan: "kanpis", addonHotel: false, businesses: 1, students: 96, joined: "2026-07-03", status: "essai", paidOnTime: true },
];

export function accountMRR(a: PlatformAccount) {
  return planPrice(a.plan, a.businesses, a.addonHotel, a.students);
}

export const PLATFORM_GROWTH = [
  { month: "Fév", accounts: 1, revenue: 819 },
  { month: "Mar", accounts: 2, revenue: 2184 },
  { month: "Avr", accounts: 3, revenue: 2534 },
  { month: "Mai", accounts: 5, revenue: 3514 },
  { month: "Jun", accounts: 6, revenue: 4879 },
  { month: "Jul", accounts: 7, revenue: 12079 },
  { month: "Aoû", accounts: 8, revenue: 19279 },
];
