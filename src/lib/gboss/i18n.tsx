import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "fr" | "ht" | "en" | "es";

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "ht", label: "Kreyòl", short: "HT" },
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" },
];

type Dict = Record<string, [string, string, string, string]>;

// [fr, ht, en, es]
const DICT: Dict = {
  dashboard: ["Tableau de bord", "Tablo debò", "Dashboard", "Panel"],
  invoicing: ["Facturation", "Faktirasyon", "Invoicing", "Facturación"],
  stock: ["Stock / Market", "Estòk / Market", "Stock / Market", "Inventario"],
  reports: ["Rapports", "Rapò", "Reports", "Informes"],
  accounting: ["Comptabilité", "Kontabilite", "Accounting", "Contabilidad"],
  suppliers: ["Fournisseurs", "Founisè", "Suppliers", "Proveedores"],
  team: ["Équipe", "Ekip", "Team", "Equipo"],
  tasks: ["Tâches", "Tach", "Tasks", "Tareas"],
  pos: ["Caisse / Vente", "Kès / Vant", "Cashier / Sales", "Caja / Ventas"],
  school: ["Institution", "Institisyon", "Institution", "Institución"],
  hotel: ["Airbnb & Hôtel", "Airbnb & Otèl", "Airbnb & Hotel", "Airbnb & Hotel"],
  printing: ["Impression", "Enpresyon", "Printing", "Impresión"],
  settings: ["Paramètres", "Paramèt", "Settings", "Ajustes"],
  superadmin: ["Super-Admin", "Super-Admin", "Super-Admin", "Super-Admin"],
  logout: ["Déconnexion", "Dekonekte", "Log out", "Cerrar sesión"],
  login: ["Connexion", "Konekte", "Log in", "Iniciar sesión"],
  signup: ["Inscription", "Enskripsyon", "Sign up", "Registro"],
  revenue: ["Revenus", "Revni", "Revenue", "Ingresos"],
  expenses: ["Dépenses", "Depans", "Expenses", "Gastos"],
  profit: ["Profit", "Pwofi", "Profit", "Beneficio"],
  today: ["Aujourd'hui", "Jodi a", "Today", "Hoy"],
  thisMonth: ["Ce mois", "Mwa sa a", "This month", "Este mes"],
  quickActions: ["Actions rapides", "Aksyon rapid", "Quick actions", "Acciones rápidas"],
  meeting: ["Organiser une réunion", "Òganize yon reyinyon", "Organise a meeting", "Organizar reunión"],
  summary: ["Résumé général", "Rezime jeneral", "General summary", "Resumen general"],
  iosBluetoothNotice: [
    "Bluetooth n'est pas disponible sur iPhone/iPad (Safari/iOS ne supporte pas le Web Bluetooth). Connectez votre imprimante au même réseau WiFi que cet appareil, ou utilisez « Partager en PDF ».",
    "Bluetooth pa disponib sou iPhone/iPad (Safari/iOS pa sipòte Web Bluetooth). Konekte enprimant ou sou menm rezo WiFi ak aparèy sa a, oswa sèvi ak « Pataje an PDF ».",
    "Bluetooth is not available on iPhone/iPad (Safari/iOS does not support Web Bluetooth). Connect your printer to the same WiFi network as this device, or use “Share as PDF”.",
    "Bluetooth no está disponible en iPhone/iPad (Safari/iOS no admite Web Bluetooth). Conecte su impresora a la misma red WiFi que este dispositivo, o use «Compartir en PDF».",
  ],
};

const INDEX: Record<Lang, number> = { fr: 0, ht: 1, en: 2, es: 3 };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: keyof typeof DICT | string) => string };

const I18nContext = createContext<Ctx>({ lang: "fr", setLang: () => {}, t: (k) => String(k) });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    const stored = window.localStorage.getItem("gboss.lang") as Lang | null;
    if (stored && stored in INDEX) setLang(stored);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        setLang(l);
        window.localStorage.setItem("gboss.lang", l);
      },
      t: (key) => {
        const row = DICT[key as string];
        return row ? (row[INDEX[lang]] ?? String(key)) : String(key);
      },

    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
