import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/moncash-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-mcc-signature");
        const timestamp = request.headers.get("x-mcc-timestamp");

        const { verifyMccWebhookSignature } = await import("@/lib/moncashconnect/client.server");

        if (!verifyMccWebhookSignature(rawBody, signature, timestamp)) {
          return new Response("Siyati envalid", { status: 401 });
        }

        let event: {
          event: string;
          reference: string;
          amount: number;
          status: string;
          failureReason?: string | null;
        };
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("JSON envalid", { status: 400 });
        }

        if (event.event === "payment.completed" || event.event === "payment.failed") {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { applyMccPaymentResult } = await import("@/lib/moncash/actions");

          await applyMccPaymentResult(supabaseAdmin, event.reference, {
            status: event.event === "payment.completed" ? "completed" : "failed",
            amount: event.amount,
            failureReason: event.failureReason ?? null,
          });
        }

        // Reponn 200 toujou sou evenman n rekonèt (menm si deja aplike) —
        // retry MonCashConnect yo dwe idempotan.
        return new Response("OK", { status: 200 });
      },
    },
  },
});
