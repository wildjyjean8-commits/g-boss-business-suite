import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { supabaseAdmin as SupabaseAdminType } from "@/integrations/supabase/client.server";
import { PLANS, MULTI_BUSINESS_SURCHARGE, HOTEL_ADDON_PRICE, type PlanId } from "@/lib/gboss/data";

async function requireOwnedBusiness(businessId: string, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: biz, error: bizError } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (bizError) {
    throw new Error(`Ou pa gen dwa sou biznis sa a. (DB error: ${bizError.message} / code: ${bizError.code ?? "?"})`);
  }
  if (!biz) {
    const { count: ownedByUser } = await supabaseAdmin
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    const host = (process.env["SUPABASE_URL"] ?? "").replace(/^https?:\/\//, "").split(".")[0];
    throw new Error(
      `Ou pa gen dwa sou biznis sa a. (business ID ${businessId} pa egziste nan pwojè sèvè a [${host}]; sèvè a wè ${ownedByUser ?? 0} biznis total pou userId ${userId})`,
    );
  }
  if (biz.owner_id !== userId) {
    throw new Error(
      `Ou pa gen dwa sou biznis sa a. (owner_id: ${biz.owner_id} != userId: ${userId})`,
    );
  }

  return { supabaseAdmin, biz };
}

async function computeSubscriptionAmount(
  supabaseAdmin: typeof SupabaseAdminType,
  biz: { id: string; owner_id: string; plan: string; hotel_addon: boolean },
): Promise<number> {
  const plan = biz.plan as PlanId;

  const { count: ownedCount } = await supabaseAdmin
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", biz.owner_id);

  let base: number;
  if (plan === "kanpis") {
    const { count: studentCount } = await supabaseAdmin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("business_id", biz.id);
    base = PLANS.kanpis.price * (studentCount ?? 0);
  } else {
    base = PLANS[plan].price;
  }

  const multi = (ownedCount ?? 1) > 1 ? base * (1 + MULTI_BUSINESS_SURCHARGE) : base;
  return Math.round(multi + (biz.hotel_addon ? HOTEL_ADDON_PRICE : 0));
}

function siteUrl(): string {
  const url = process.env["SITE_URL"];
  if (!url) throw new Error("Manke varyab anviwònman SITE_URL (konfigire l sou Netlify).");
  return url.replace(/\/$/, "");
}

export const createSubscriptionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { businessId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, biz } = await requireOwnedBusiness(data.businessId, context.userId);
    const { createMccPayment } = await import("@/lib/moncashconnect/client.server");

    const amount = await computeSubscriptionAmount(supabaseAdmin, biz);
    if (amount <= 0) {
      throw new Error("Pa gen okenn kantite pou peye pou plan sa a.");
    }

    const orderId = `sub-${biz.id}-${Date.now()}`;

    const { error: insertError } = await supabaseAdmin.from("moncash_transactions").insert({
      business_id: biz.id,
      order_id: orderId,
      amount,
      currency: "HTG",
      status: "pending",
      purpose: "subscription",
    });
    if (insertError) throw new Error(`Echèk anrejistreman tranzaksyon: ${insertError.message}`);

    const returnUrl = `${siteUrl()}/moncash-return?orderId=${encodeURIComponent(orderId)}`;
    const payment = await createMccPayment(orderId, amount, returnUrl);

    return { orderId, amount, redirectUrl: payment.paymentUrl };
  });

/**
 * Aplike yon peman konplete sou biznis lan + tranzaksyon an.
 * Itilize ni pa confirmSubscriptionPayment (retounen kliyan) ni pa webhook la —
 * idempotan: si tranzaksyon an deja "completed", pa fè anyen de plis.
 */
export async function applyMccPaymentResult(
  supabaseAdmin: typeof SupabaseAdminType,
  orderId: string,
  outcome: { status: "completed" | "failed"; amount: number; failureReason?: string | null },
) {
  const { data: txRow } = await supabaseAdmin
    .from("moncash_transactions")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (!txRow) return null;
  if (txRow.status === "completed") return txRow; // deja aplike — idempotan

  await supabaseAdmin
    .from("moncash_transactions")
    .update({
      status: outcome.status,
      raw_response: JSON.parse(JSON.stringify(outcome)),
      confirmed_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);

  if (outcome.status === "completed" && txRow.business_id) {
    const paidUntil = new Date();
    paidUntil.setMonth(paidUntil.getMonth() + 1);

    await supabaseAdmin
      .from("businesses")
      .update({
        status: "actif",
        paid_on_time: true,
        subscription_paid_until: paidUntil.toISOString(),
      })
      .eq("id", txRow.business_id);
  }

  return txRow;
}

export const confirmSubscriptionPayment = createServerFn({ method: "POST" })
  .validator((data: { orderId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getMccPaymentStatus } = await import("@/lib/moncashconnect/client.server");

    const { data: txRow, error: txError } = await supabaseAdmin
      .from("moncash_transactions")
      .select("*")
      .eq("order_id", data.orderId)
      .single();

    if (txError || !txRow) {
      return { status: "not_found" as const };
    }

    if (txRow.status === "completed") {
      return { status: "completed" as const, amount: txRow.amount };
    }

    // Peman MonCashConnect konfime pa webhook — men n ap tcheke /pay-status
    // la a tou kòm sekou (kliyan an ka tounen anvan webhook la rive).
    const payment = await getMccPaymentStatus(data.orderId);

    if (!payment || payment.status === "pending") {
      return { status: "pending" as const };
    }

    await applyMccPaymentResult(supabaseAdmin, data.orderId, {
      status: payment.status,
      amount: payment.amount,
      failureReason: payment.failureReason,
    });

    return { status: payment.status, amount: txRow.amount };
  });
