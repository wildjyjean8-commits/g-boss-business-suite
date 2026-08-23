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
  // Infos entreprise (optionnelles — viennent des Paramètres)
  logoUrl?: string | null;
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  taxNumber?: string | null;
};

const FORMAT_STYLE: Record<ReceiptFormat, { width: string; pageSize: string; base: string; pxWidth: number }> = {
  "58": { width: "190px", pageSize: "58mm auto", base: "10px", pxWidth: 190 },
  "80": { width: "300px", pageSize: "80mm auto", base: "11px", pxWidth: 300 },
  a4: { width: "720px", pageSize: "A4", base: "13px", pxWidth: 720 },
};

function fmt(n: number, currency: "HTG" | "USD") {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

const PAYMENT_LABEL: Record<string, string> = {
  kach: "Cash",
  moncash: "MonCash",
  kat: "Carte",
};

function receiptStyles(format: ReceiptFormat) {
  const style = FORMAT_STYLE[format];
  return `
    @page { size: ${style.pageSize}; margin: ${format === "a4" ? "16mm" : "2mm"}; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; width: ${style.width}; max-width: 100%; margin: 0 auto; padding: 16px; color: #0A0A14; font-size: ${style.base}; background: #fff; }
    .logo { display: block; max-height: 56px; max-width: 100%; margin: 0 auto 8px; object-fit: contain; }
    h1 { font-size: 16px; text-align: center; margin: 0 0 2px; }
    .sub { text-align: center; font-size: 11px; color: #555; margin: 0 0 2px; }
    .biz-info { text-align: center; font-size: 10px; color: #666; margin: 0 0 10px; line-height: 1.4; }
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
  `;
}

function receiptBodyHtml(r: PrintableReceipt): string {
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

  const infoBits = [r.address, r.phone, r.email, r.taxNumber ? `NIF ${r.taxNumber}` : null].filter(Boolean);

  return `
    ${r.logoUrl ? `<img class="logo" src="${r.logoUrl}" crossorigin="anonymous" />` : ""}
    <h1>${r.legalName || r.businessName}</h1>
    <p class="sub">Reçu de vente</p>
    ${infoBits.length ? `<p class="biz-info">${infoBits.join(" · ")}</p>` : ""}
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
  `;
}

export function printReceipt(r: PrintableReceipt) {
  const format = r.format ?? "80";
  const winWidth = format === "a4" ? 820 : 380;
  const win = window.open("", "_blank", `width=${winWidth},height=720`);
  if (!win) {
    alert("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site, puis réessayez.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Reçu ${r.reference ?? ""}</title>
        <style>${receiptStyles(format)}</style>
      </head>
      <body>
        ${receiptBodyHtml(r)}
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  win.document.close();
}

/**
 * Rann resi a nan yon div ki kache sou paj la (pa afiche a lekran) pou nou
 * ka pran yon "capture" html2canvas ladan l — itilize pou export PDF/JPEG.
 */
async function renderOffscreen(r: PrintableReceipt): Promise<HTMLDivElement> {
  const format = r.format ?? "80";
  const style = FORMAT_STYLE[format];
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${style.pxWidth}px`;
  container.style.background = "#fff";
  container.innerHTML = `<style>${receiptStyles(format)}</style><div id="gb-receipt-capture">${receiptBodyHtml(r)}</div>`;
  document.body.appendChild(container);

  const img = container.querySelector("img.logo") as HTMLImageElement | null;
  if (img && !img.complete) {
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      setTimeout(resolve, 3000);
    });
  }

  return container;
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadReceiptJpeg(r: PrintableReceipt): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const container = await renderOffscreen(r);
  try {
    const target = container.querySelector("#gb-receipt-capture") as HTMLElement;
    const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    triggerDownload(dataUrl, `${r.reference ?? "recu"}.jpg`);
  } finally {
    container.remove();
  }
}

export async function downloadReceiptPdf(r: PrintableReceipt): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const format = r.format ?? "80";
  const container = await renderOffscreen(r);
  try {
    const target = container.querySelector("#gb-receipt-capture") as HTMLElement;
    const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pxToMm = (px: number) => (px * 25.4) / 96;
    const widthMm = format === "a4" ? 210 : format === "80" ? 80 : 58;
    const heightMm = format === "a4" ? 297 : pxToMm((canvas.height / canvas.width) * FORMAT_STYLE[format].pxWidth);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: format === "a4" ? "a4" : [widthMm, heightMm],
    });

    if (format === "a4") {
      const usableWidth = 210 - 32; // marges 16mm de chaque côté
      const imgHeightMm = (canvas.height / canvas.width) * usableWidth;
      pdf.addImage(imgData, "PNG", 16, 16, usableWidth, imgHeightMm);
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);
    }

    pdf.save(`${r.reference ?? "recu"}.pdf`);
  } finally {
    container.remove();
  }
}
