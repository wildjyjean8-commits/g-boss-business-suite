import { createServerFn } from "@tanstack/react-start";
import type { supabaseAdmin as SupabaseAdminType } from "@/integrations/supabase/client.server";
import { PLANS, MULTI_BUSINESS_SURCHARGE, HOTEL_ADDON_PRICE, type PlanId } from "@/lib/gboss/data";

type AuthedInput = { accessToken: string };

async function requireOwnedBusiness(businessId: string, accessToken: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData.user) {
    throw new Error("Sesyon ekspire — rekonekte epi eseye ankò.");
  }

  const { data: biz, error: bizError } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (bizError || !biz || biz.owner_id !== userData.user.id) {
    throw new Error("Ou pa gen dwa sou biznis sa a.");
  }

  return { supabaseAdmin, userId: userData.user.id, biz };
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

export const createSubscriptionPayment = createServerFn({ method: "POST" })
  .validator((data: AuthedInput & { businessId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin, biz } = await requireOwnedBusiness(data.businessId, data.accessToken);
    const { createMoncashPayment } = await import("./client.server");

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

    const payment = await createMoncashPayment(orderId, amount);

    return { orderId, amount, redirectUrl: payment.redirectUrl };
  });

export const confirmSubscriptionPayment = createServerFn({ method: "POST" })
  .validator((data: { orderId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { retrieveMoncashOrderPayment } = await import("./client.server");

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

    const payment = await retrieveMoncashOrderPayment(data.orderId);

    if (!payment) {
      return { status: "pending" as const };
    }

    const isSuccess = payment.message?.toLowerCase() === "successful";

    await supabaseAdmin
      .from("moncash_transactions")
      .update({
        status: isSuccess ? "completed" : "failed",
        moncash_transaction_id: payment.transactionId,
        reference_id: payment.reference,
        raw_response: JSON.parse(JSON.stringify(payment)),
        confirmed_at: new Date().toISOString(),
      })
      .eq("order_id", data.orderId);

    if (isSuccess && txRow.business_id) {
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

    return {
      status: isSuccess ? ("completed" as const) : ("failed" as const),
      amount: txRow.amount,
    };
  });
