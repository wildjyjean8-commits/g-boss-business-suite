export type ReceiptLine = { name: string; qty: number; unitPrice: number };

export type ReceiptFormat = "58" | "80" | "a4";

export type PrintableReceipt = {
  businessName: string;
  reference: string | null;
  date: string;
  client: string | null;
  lines: ReceiptLine[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: "HTG" | "USD";
  paymentMethod: string;
  format?: ReceiptFormat;
};

const FORMAT_STYLE: Record<ReceiptFormat, { width: string; pageSize: string; base: string }> = {
  "58": { width: "190px", pageSize: "58mm auto", base: "10px" },
  "80": { width: "300px", pageSize: "80mm auto", base: "11px" },
  a4: { width: "100%", pageSize: "A4", base: "13px" },
};

function fmt(n: number, currency: "HTG" | "USD") {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

const PAYMENT_LABEL: Record<string, string> = {
  kach: "Cash",
  moncash: "MonCash",
  kat: "Carte",
};

export function printReceipt(r: PrintableReceipt) {
  const format = r.format ?? "80";
  const style = FORMAT_STYLE[format];
  const winWidth = format === "a4" ? 820 : 380;
  const win = window.open("", "_blank", `width=${winWidth},height=720`);
  if (!win) {
    alert(
      "Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site, puis réessayez.",
    );
    return;
  }

  const rows = r.lines
    .map(
      (l) => `
        <tr>
          <td>${l.name}</td>
          <td class="num">${l.qty}</td>
          <td class="num">${fmt(l.unitPrice, r.currency)}</td>
          <td class="num">${fmt(l.unitPrice * l.qty, r.currency)}</td>
        </tr>`,
    )
    .join("");

  win.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Reçu ${r.reference ?? ""}</title>
        <style>
          @page { size: ${style.pageSize}; margin: ${format === "a4" ? "16mm" : "2mm"}; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; width: ${style.width}; max-width: 100%; margin: 0 auto; padding: 16px; color: #0A0A14; font-size: ${style.base}; }
          h1 { font-size: 16px; text-align: center; margin: 0 0 2px; }
          .sub { text-align: center; font-size: 11px; color: #555; margin: 0 0 12px; }
          .meta { font-size: 11px; margin-bottom: 10px; }
          .meta div { display: flex; justify-content: space-between; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0; }
          th { text-align: left; border-bottom: 1px solid #ccc; padding: 4px 2px; font-size: 10px; text-transform: uppercase; color: #666; }
          td { padding: 4px 2px; border-bottom: 1px dashed #eee; }
          .num { text-align: right; }
          .totals { margin-top: 10px; font-size: 12px; }
          .totals div { display: flex; justify-content: space-between; margin: 2px 0; }
          .grand { font-size: 15px; font-weight: 700; border-top: 1px solid #000; margin-top: 6px; padding-top: 6px; }
          .footer { text-align: center; font-size: 11px; margin-top: 16px; color: #555; }
        </style>
      </head>
      <body>
        <h1>${r.businessName}</h1>
        <p class="sub">Reçu de vente</p>
        <div class="meta">
          <div><span>Référence</span><span>${r.reference ?? "—"}</span></div>
          <div><span>Date</span><span>${r.date}</span></div>
          ${r.client ? `<div><span>Client</span><span>${r.client}</span></div>` : ""}
          <div><span>Paiement</span><span>${PAYMENT_LABEL[r.paymentMethod] ?? r.paymentMethod}</span></div>
        </div>
        <table>
          <thead>
            <tr><th>Article</th><th class="num">Qté</th><th class="num">P.U.</th><th class="num">Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div><span>Sous-total</span><span>${fmt(r.subtotal, r.currency)}</span></div>
          <div><span>Taxe (${r.taxRate}%)</span><span>${fmt(r.tax, r.currency)}</span></div>
          <div class="grand"><span>Total</span><span>${fmt(r.total, r.currency)}</span></div>
        </div>
        <p class="footer">Mèsi pou biznis ou! · Powered by G-Boss</p>
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  win.document.close();
}
