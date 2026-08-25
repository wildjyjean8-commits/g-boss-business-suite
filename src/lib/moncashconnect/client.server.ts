// SERVER-ONLY — pa janm enpòte fichye sa a nan yon route/component ki ale nan bundle
// kliyan an. MCC_SECRET_KEY pa dwe janm rive bò kote navigatè a.
//
// MonCashConnect se yon pasrèl endepandan (pa Digicel/MonCash ofisyèl) —
// wè nòt sekirite ki te diskite nan chat la. Dokimantasyon: moncashconnect.com/docs

import { createHmac, timingSafeEqual } from "node:crypto";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Manke varyab anviwònman ${name} (konfigire l sou Netlify).`);
  return value;
}

const API_BASE = "https://api.moncashconnect.com/v1";

export type CreatedMccPayment = {
  paymentUrl: string;
  reference: string;
  expiresAt: string;
};

export async function createMccPayment(
  referenceId: string,
  amount: number,
  returnUrl: string,
  opts?: { customerName?: string; customerEmail?: string },
): Promise<CreatedMccPayment> {
  const secretKey = getEnv("MCC_SECRET_KEY");

  const res = await fetch(`${API_BASE}/pay-create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${referenceId}-1`,
    },
    body: JSON.stringify({
      amount,
      referenceId,
      returnUrl,
      ...(opts?.customerName ? { customerName: opts.customerName } : {}),
      ...(opts?.customerEmail ? { customerEmail: opts.customerEmail } : {}),
    }),
  });

  const body = (await res.json()) as {
    paymentUrl?: string;
    reference?: string;
    expiresAt?: string;
    error?: string;
    code?: string;
  };

  if (!res.ok || !body.paymentUrl) {
    throw new Error(
      `MonCashConnect pay-create echwe: ${body.error ?? res.status} (${body.code ?? "?"})`,
    );
  }

  return {
    paymentUrl: body.paymentUrl,
    reference: body.reference ?? referenceId,
    expiresAt: body.expiresAt ?? "",
  };
}

export type MccPaymentStatus = {
  reference: string;
  status: "pending" | "completed" | "failed";
  amount: number;
  netAmount: number;
  completedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
};

export async function getMccPaymentStatus(referenceId: string): Promise<MccPaymentStatus | null> {
  const secretKey = getEnv("MCC_SECRET_KEY");

  const res = await fetch(`${API_BASE}/pay-status?referenceId=${encodeURIComponent(referenceId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (res.status === 404) return null;

  const body = (await res.json()) as MccPaymentStatus & { error?: string };
  if (!res.ok) {
    throw new Error(`MonCashConnect pay-status echwe: ${body.error ?? res.status}`);
  }

  return body;
}

/**
 * Verifye siyati HMAC-SHA256 yon webhook MonCashConnect.
 * rawBody DWE tèks brit kò a te resevwa a (anvan JSON.parse).
 */
export function verifyMccWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
): boolean {
  if (!signatureHeader || !timestampHeader) return false;

  const secret = process.env["MCC_WEBHOOK_SECRET"];
  if (!secret) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false; // 5 min

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
