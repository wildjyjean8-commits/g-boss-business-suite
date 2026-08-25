// SERVER-ONLY — pa janm enpòte fichye sa a nan yon route/component ki ale nan bundle
// kliyan an. client_secret pa dwe janm rive bò kote navigatè a.
//
// Dokimantasyon ofisyèl: MonCash REST API (Digicel), v1.

type MoncashMode = "sandbox" | "live";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Manke varyab anviwònman ${name} (konfigire l sou Netlify).`);
  return value;
}

function hostFor(mode: MoncashMode): string {
  return mode === "live"
    ? "https://moncashbutton.digicelgroup.com/Api"
    : "https://sandbox.moncashbutton.digicelgroup.com/Api";
}

function gatewayBaseFor(mode: MoncashMode): string {
  return mode === "live"
    ? "https://moncashbutton.digicelgroup.com/Moncash-middleware"
    : "https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware";
}

function getMode(): MoncashMode {
  const mode = process.env["MONCASH_MODE"];
  return mode === "live" ? "live" : "sandbox";
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.token;
  }

  const clientId = getEnv("MONCASH_CLIENT_ID");
  const clientSecret = getEnv("MONCASH_CLIENT_SECRET");
  const host = hostFor(getMode());

  const res = await fetch(`${host}/oauth/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "scope=read,write&grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`MonCash oauth/token echwe (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

export type CreatedMoncashPayment = {
  token: string;
  redirectUrl: string;
};

/** Kreye yon peman MonCash e retounen lyen redireksyon pou navigatè kliyan an. */
export async function createMoncashPayment(
  orderId: string,
  amount: number,
): Promise<CreatedMoncashPayment> {
  const mode = getMode();
  const host = hostFor(mode);
  const accessToken = await getAccessToken();

  const res = await fetch(`${host}/v1/CreatePayment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ amount, orderId }),
  });

  const body = (await res.json()) as {
    payment_token?: { token: string };
    status?: number;
    error?: string;
    message?: string;
  };

  if (!res.ok || !body.payment_token?.token) {
    throw new Error(`MonCash CreatePayment echwe: ${body.message ?? body.error ?? res.status}`);
  }

  const token = body.payment_token.token;
  return {
    token,
    redirectUrl: `${gatewayBaseFor(mode)}/Payment/Redirect?token=${encodeURIComponent(token)}`,
  };
}

export type MoncashOrderPayment = {
  reference: string;
  transactionId: string;
  cost: number;
  message: string;
  payer: string;
};

/** Verifye estati yon peman apre kliyan an retounen sou sit la, pa orderId. */
export async function retrieveMoncashOrderPayment(
  orderId: string,
): Promise<MoncashOrderPayment | null> {
  const host = hostFor(getMode());
  const accessToken = await getAccessToken();

  const res = await fetch(`${host}/v1/RetrieveOrderPayment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ orderId }),
  });

  if (res.status === 404) return null;

  const body = (await res.json()) as {
    payment?: {
      reference: string;
      transaction_id: string;
      cost: number;
      message: string;
      payer: string;
    };
    message?: string;
    error?: string;
  };

  if (!res.ok || !body.payment) {
    if (res.status >= 500)
      throw new Error(`MonCash RetrieveOrderPayment echwe: ${body.message ?? res.status}`);
    return null;
  }

  return {
    reference: body.payment.reference,
    transactionId: body.payment.transaction_id,
    cost: body.payment.cost,
    message: body.payment.message,
    payer: body.payment.payer,
  };
}
