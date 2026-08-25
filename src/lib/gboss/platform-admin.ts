import { createServerFn } from "@tanstack/react-start";
import { PLANS, planPrice, type PlanId } from "@/lib/gboss/data";

async function requireSuperAdmin(accessToken: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData.user) {
    throw new Error("Sesyon ekspire — rekonekte epi eseye ankò.");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile?.is_super_admin) {
    throw new Error("Ou pa gen dwa Super-Admin.");
  }

  return { supabaseAdmin };
}

export type PlatformAccount = {
  ownerId: string;
  name: string;
  sector: string;
  plan: PlanId;
  addonHotel: boolean;
  businesses: number;
  students: number;
  joined: string;
  status: "actif" | "essai" | "restreint" | "annule";
  paidOnTime: boolean;
  mrr: number;
};

export type PlatformGrowthPoint = {
  month: string;
  accounts: number;
  revenue: number;
};

export type PlatformOverview = {
  accounts: PlatformAccount[];
  growth: PlatformGrowthPoint[];
};

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export const fetchPlatformOverview = createServerFn({ method: "GET" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<PlatformOverview> => {
    const { supabaseAdmin } = await requireSuperAdmin(data.accessToken);

    const { data: businesses, error: bizError } = await supabaseAdmin
      .from("businesses")
      .select("id, owner_id, name, sector, plan, hotel_addon, status, paid_on_time, created_at")
      .order("created_at", { ascending: true });
    if (bizError) throw new Error(`Echèk chajman biznis yo: ${bizError.message}`);

    const { data: students, error: studError } = await supabaseAdmin
      .from("students")
      .select("business_id");
    if (studError) throw new Error(`Echèk chajman elèv yo: ${studError.message}`);

    const studentCountByBusiness = new Map<string, number>();
    for (const row of students ?? []) {
      studentCountByBusiness.set(
        row.business_id,
        (studentCountByBusiness.get(row.business_id) ?? 0) + 1,
      );
    }

    type OwnerGroup = {
      ownerId: string;
      businesses: typeof businesses;
      firstCreatedAt: string;
    };
    const byOwner = new Map<string, OwnerGroup>();
    for (const biz of businesses ?? []) {
      const existing = byOwner.get(biz.owner_id);
      if (existing) {
        existing.businesses.push(biz);
        if (biz.created_at < existing.firstCreatedAt) existing.firstCreatedAt = biz.created_at;
      } else {
        byOwner.set(biz.owner_id, {
          ownerId: biz.owner_id,
          businesses: [biz],
          firstCreatedAt: biz.created_at,
        });
      }
    }

    const accounts: PlatformAccount[] = Array.from(byOwner.values()).map((group) => {
      const primary = group.businesses[0]!;
      const plan = primary.plan as PlanId;
      const addonHotel = group.businesses.some((b) => b.hotel_addon);
      const studentTotal = group.businesses.reduce(
        (sum, b) => sum + (studentCountByBusiness.get(b.id) ?? 0),
        0,
      );
      const paidOnTime = group.businesses.every((b) => b.paid_on_time);

      return {
        ownerId: group.ownerId,
        name: primary.name,
        sector: primary.sector,
        plan,
        addonHotel,
        businesses: group.businesses.length,
        students: studentTotal,
        joined: group.firstCreatedAt.slice(0, 10),
        status: primary.status as PlatformAccount["status"],
        paidOnTime,
        mrr: planPrice(plan, group.businesses.length, addonHotel, studentTotal),
      };
    });

    // Kwasans mansyèl : nouvo kont (pa mwa premye biznis yo kreye) + revni kimile
    // ki soti nan vrè peman MonCash konplete yo (pa yon estimasyon).
    const { data: completedPayments, error: payError } = await supabaseAdmin
      .from("moncash_transactions")
      .select("amount, confirmed_at")
      .eq("status", "completed")
      .eq("purpose", "subscription");
    if (payError) throw new Error(`Echèk chajman tranzaksyon yo: ${payError.message}`);

    const monthKey = (iso: string) => iso.slice(0, 7); // "2026-08"

    const accountsByMonth = new Map<string, number>();
    for (const acc of accounts) {
      const key = monthKey(acc.joined);
      accountsByMonth.set(key, (accountsByMonth.get(key) ?? 0) + 1);
    }

    const revenueByMonth = new Map<string, number>();
    for (const tx of completedPayments ?? []) {
      if (!tx.confirmed_at) continue;
      const key = monthKey(tx.confirmed_at);
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + tx.amount);
    }

    const allMonths = Array.from(
      new Set([...accountsByMonth.keys(), ...revenueByMonth.keys()]),
    ).sort();

    let cumulativeAccounts = 0;
    let cumulativeRevenue = 0;
    const growth: PlatformGrowthPoint[] = allMonths.map((key) => {
      cumulativeAccounts += accountsByMonth.get(key) ?? 0;
      cumulativeRevenue += revenueByMonth.get(key) ?? 0;
      const [, monthNum] = key.split("-");
      const label = MONTH_LABELS[Number(monthNum) - 1] ?? key;
      return { month: label, accounts: cumulativeAccounts, revenue: cumulativeRevenue };
    });

    return { accounts, growth };
  });
