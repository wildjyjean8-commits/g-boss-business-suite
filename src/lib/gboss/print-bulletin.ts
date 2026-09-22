export type BulletinGradeLine = { subject: string; period: string; grade: number; max_grade: number; comment: string | null };

export type PrintableBulletin = {
  businessName: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  studentName: string;
  classroom: string | null;
  period: string;
  average: number | null;
  attendance: number | null;
  lines: BulletinGradeLine[];
};

function styles() {
  return `
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0A0A14; font-size: 13px; }
    .logo { display: block; max-height: 64px; margin: 0 auto 8px; object-fit: contain; }
    h1 { text-align: center; font-size: 20px; margin: 0 0 2px; }
    .sub { text-align: center; color: #555; font-size: 12px; margin: 0 0 16px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 6px; padding: 10px 14px; background: #F4F5FA; border-radius: 10px; font-size: 13px; }
    .kpis { display: flex; gap: 10px; margin: 14px 0; }
    .kpi { flex: 1; text-align: center; padding: 10px; border: 1px solid #E4E6F0; border-radius: 10px; }
    .kpi .v { font-size: 20px; font-weight: 700; }
    .kpi .l { font-size: 11px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th { text-align: left; border-bottom: 2px solid #0A0A14; padding: 6px 4px; font-size: 11px; text-transform: uppercase; color: #444; }
    td { padding: 6px 4px; border-bottom: 1px solid #eee; }
    .num { text-align: right; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
    .sign { border-top: 1px solid #333; width: 160px; text-align: center; padding-top: 4px; margin-top: 40px; }
  `;
}

function body(b: PrintableBulletin): string {
  const rows = b.lines
    .map(
      (l) => `
      <tr>
        <td>${l.subject}</td>
        <td>${l.period}</td>
        <td class="num">${l.grade}/${l.max_grade}</td>
        <td>${l.comment ?? ""}</td>
      </tr>`,
    )
    .join("");

  return `
    ${b.logoUrl ? `<img class="logo" src="${b.logoUrl}" />` : ""}
    <h1>${b.businessName}</h1>
    <p class="sub">${[b.address, b.phone].filter(Boolean).join(" · ")}</p>
    <h2 style="text-align:center;margin:0 0 14px;font-size:16px;">Bulletin — ${b.period}</h2>

    <div class="meta">
      <span><strong>Elèv:</strong> ${b.studentName}</span>
      <span><strong>Klas:</strong> ${b.classroom ?? "—"}</span>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="v">${b.average != null ? `${b.average}/20` : "—"}</div><div class="l">Mwayèn Jeneral</div></div>
      <div class="kpi"><div class="v">${b.attendance != null ? `${b.attendance}%` : "—"}</div><div class="l">Prezans</div></div>
    </div>

    <table>
      <thead><tr><th>Matyè</th><th>Peryòd</th><th>Nòt</th><th>Kòmantè</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div class="sign">Siyati Direktè/Direktris</div>
      <div class="sign">Siyati Paran/Titè</div>
    </div>
  `;
}

export function printBulletin(b: PrintableBulletin) {
  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) {
    alert("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site, puis réessayez.");
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Bulletin — ${b.studentName}</title>
        <style>${styles()}</style>
      </head>
      <body>
        ${body(b)}
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  win.document.close();
}
