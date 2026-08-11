/**
 * Real report exports — Excel, CSV, PDF (print-to-PDF sheet) and PNG.
 * Everything is generated in the browser from the report payload, so every
 * button on the Reports page downloads an actual file.
 */

import * as XLSX from "xlsx";

export interface ReportPayload {
  title: string;
  club: string;
  subtitle: string;
  headline: Array<{ label: string; value: string }>;
  columns: string[];
  rows: Array<Array<string | number>>;
  observations: string[];
  medical?: string[];
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function baseName(p: ReportPayload) {
  return `${slug(p.club)}-${slug(p.title)}`;
}

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportReportCsv(p: ReportPayload) {
  const lines = [
    [p.club, p.title].map(csvCell).join(","),
    [p.subtitle].map(csvCell).join(","),
    "",
    p.headline.map((h) => csvCell(h.label)).join(","),
    p.headline.map((h) => csvCell(h.value)).join(","),
    "",
    p.columns.map(csvCell).join(","),
    ...p.rows.map((r) => r.map(csvCell).join(",")),
    "",
    "Key observations",
    ...p.observations.map((o) => csvCell(o)),
  ];
  saveBlob(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }), `${baseName(p)}.csv`);
}

export function exportReportExcel(p: ReportPayload) {
  const wb = XLSX.utils.book_new();

  const summary = [
    ["T4P · Training 4 Performance"],
    [p.club, p.title],
    [p.subtitle],
    [`Generated ${new Date().toLocaleString()}`],
    [],
    ...p.headline.map((h) => [h.label, h.value]),
    [],
    ["Key observations"],
    ...p.observations.map((o) => [o]),
    ...(p.medical?.length ? [[], ["Medical & availability"], ...p.medical.map((m) => [m])] : []),
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

  const table = [p.columns, ...p.rows];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(table.length > 1 ? table : [p.columns, ["No records in range"]]),
    "Player summary",
  );

  const bytes = new Uint8Array(XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer);
  saveBlob(
    new Blob([bytes.buffer as ArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${baseName(p)}.xlsx`,
  );
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));

/** T4P brand blue — kept in sync with the app's primary colour. */
const BRAND = "#2f9fd4";

const stamp = () => new Date().toLocaleString();

export function reportHtml(p: ReportPayload) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.club)} — ${esc(p.title)}</title>
<style>
@page{size:A4 landscape;margin:12mm}
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111;margin:0;padding:0}
.wrap{padding:0 22px 22px}
header{display:flex;align-items:center;gap:14px;border-bottom:3px solid ${BRAND};padding:16px 22px;margin-bottom:14px}
.mark{width:44px;height:44px;border-radius:10px;background:${BRAND};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;letter-spacing:.02em}
h1{font-size:20px;margin:0}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:${BRAND};margin:20px 0 6px;border-bottom:1px solid #e6e6e6;padding-bottom:4px}
p.sub{color:#555;margin:3px 0 0;font-size:12px}
.cards{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.card{border:1px solid #e2e2e2;border-top:3px solid ${BRAND};border-radius:8px;padding:8px 12px;min-width:130px}
.card span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#666}
.card strong{font-size:18px}
table{width:100%;border-collapse:collapse;font-size:11px}
th,td{border-bottom:1px solid #ececec;padding:5px 6px;text-align:right}
th:first-child,td:first-child{text-align:left}
tbody tr:nth-child(even){background:#fafafa}
th{background:${BRAND};color:#fff;text-transform:uppercase;font-size:10px;letter-spacing:.05em}
ul{font-size:12px;color:#333;padding-left:18px;margin:0}
footer{margin-top:22px;border-top:1px solid #e6e6e6;padding-top:8px;font-size:10px;color:#888;display:flex;justify-content:space-between}
</style></head><body>
<header><div class="mark">T4P</div><div>
<h1>${esc(p.club)} — ${esc(p.title)}</h1><p class="sub">${esc(p.subtitle)}</p></div></header>
<div class="wrap">
<div class="cards">${p.headline
    .map((h) => `<div class="card"><span>${esc(h.label)}</span><strong>${esc(h.value)}</strong></div>`)
    .join("")}</div>
<h2>Player summary</h2>
<table><thead><tr>${p.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
<tbody>${
    p.rows.length
      ? p.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${p.columns.length}">No records in the selected range</td></tr>`
  }</tbody></table>
${p.medical?.length ? `<h2>Medical &amp; availability</h2><ul>${p.medical.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
<h2>Key observations</h2><ul>${p.observations.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
<footer><span>Training 4 Performance · training4performance.com</span><span>Generated ${esc(stamp())}</span></footer>
</div>
</body></html>`;
}


/** Opens a print-ready sheet; the browser's print dialog saves it as PDF. */
export function exportReportPdf(p: ReportPayload) {
  const w = window.open("", "_blank");
  if (!w) {
    // Popup blocked — fall back to downloading the printable HTML file.
    saveBlob(new Blob([reportHtml(p)], { type: "text/html" }), `${baseName(p)}.html`);
    return false;
  }
  w.document.write(reportHtml(p));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}

/** Draws the report onto a canvas and downloads a real PNG. */
export function exportReportPng(p: ReportPayload) {
  const width = 1400;
  const pad = 40;
  const rowH = 26;
  const height = 220 + (p.rows.length + 2) * rowH + p.observations.length * 24 + 120;
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  // branded header band
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, width, 6);
  ctx.fillRect(pad, 26, 46, 46);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText("T4P", pad + 7, 55);
  ctx.fillStyle = "#111111";
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.fillText(`${p.club} — ${p.title}`, pad + 62, 52);
  ctx.fillStyle = "#555555";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(p.subtitle, pad + 62, 74);

  let x = pad;
  p.headline.forEach((h) => {
    ctx.strokeStyle = "#e2e2e2";
    ctx.strokeRect(x, 96, 200, 62);
    ctx.fillStyle = BRAND;
    ctx.fillRect(x, 96, 200, 3);
    ctx.fillStyle = "#666666";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(h.label.toUpperCase(), x + 12, 122);
    ctx.fillStyle = "#111111";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillText(h.value, x + 12, 148);
    x += 212;
  });

  const colW = (width - pad * 2) / Math.max(p.columns.length, 1);
  let y = 200;
  ctx.fillStyle = BRAND;
  ctx.fillRect(pad, y - 16, width - pad * 2, 24);
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  p.columns.forEach((c, i) => ctx.fillText(String(c).slice(0, 18), pad + 6 + i * colW, y));

  y += 22;
  ctx.font = "12px system-ui, sans-serif";
  p.rows.forEach((r, ri) => {
    if (ri % 2 === 1) {
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(pad, y - 16, width - pad * 2, rowH);
    }
    ctx.fillStyle = "#111111";
    r.forEach((c, i) => ctx.fillText(String(c).slice(0, 20), pad + 6 + i * colW, y));
    y += rowH;
  });

  y += 20;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillStyle = BRAND;
  ctx.fillText("KEY OBSERVATIONS", pad, y);
  y += 24;
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillStyle = "#444444";
  p.observations.forEach((o) => {
    ctx.fillText(`• ${o}`, pad, y);
    y += 24;
  });

  ctx.strokeStyle = "#e6e6e6";
  ctx.beginPath();
  ctx.moveTo(pad, height - 44);
  ctx.lineTo(width - pad, height - 44);
  ctx.stroke();
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "#888888";
  ctx.fillText("Training 4 Performance · training4performance.com", pad, height - 24);
  ctx.fillText(`Generated ${stamp()}`, width - pad - 220, height - 24);

  canvas.toBlob((blob) => {
    if (blob) saveBlob(blob, `${baseName(p)}.png`);
  }, "image/png");

}

export function exportReport(format: string, payload: ReportPayload) {
  switch (format) {
    case "Excel":
      exportReportExcel(payload);
      return "Excel file downloaded.";
    case "CSV":
      exportReportCsv(payload);
      return "CSV file downloaded.";
    case "PNG":
      exportReportPng(payload);
      return "PNG image downloaded.";
    default:
      return exportReportPdf(payload)
        ? "PDF sheet opened — use your browser's print dialog to save it."
        : "Pop-up blocked, printable HTML downloaded instead.";
  }
}

/* ------------------------------------------------------------------ */
/* Training session sheet (A4 portrait, print-to-PDF)                  */
/* ------------------------------------------------------------------ */

export interface SessionSheetPayload {
  club: string;
  date: string;
  label: string;
  type: string;
  group: string;
  objective: string;
  minutes: number;
  rpe: number;
  load: number;
  blocks: Array<{
    name: string;
    minutes: number;
    items: Array<{ drill: string; detail: string }>;
  }>;
}

export function sessionSheetHtml(s: SessionSheetPayload) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(s.type)} — ${esc(s.date)}</title>
<style>
@page{size:A4 portrait;margin:12mm}
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111;margin:0}
header{display:flex;align-items:center;gap:14px;border-bottom:3px solid ${BRAND};padding:14px 18px}
.mark{width:42px;height:42px;border-radius:10px;background:${BRAND};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}
h1{font-size:19px;margin:0}
p.sub{color:#555;margin:3px 0 0;font-size:12px}
.wrap{padding:14px 18px}
.cards{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.card{border:1px solid #e2e2e2;border-top:3px solid ${BRAND};border-radius:8px;padding:8px 12px;min-width:120px}
.card span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#666}
.card strong{font-size:18px}
.block{border:1px solid #e6e6e6;border-radius:8px;padding:10px 12px;margin-bottom:10px;page-break-inside:avoid}
.block h2{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:${BRAND};margin:0 0 6px;display:flex;justify-content:space-between}
.block li{font-size:12px;margin-bottom:4px}
.block li em{display:block;font-style:normal;color:#666;font-size:11px}
.empty{font-size:11px;color:#999}
.note{font-size:10.5px;color:#666;border-top:1px solid #eee;padding-top:8px;margin-top:10px;line-height:1.5}
footer{font-size:10px;color:#888;display:flex;justify-content:space-between;margin-top:14px;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
<header><div class="mark">T4P</div><div>
<h1>${esc(s.type)} — ${esc(s.label)}</h1>
<p class="sub">${esc(s.club)} · ${esc(s.date)} · ${esc(s.group)}${s.objective ? ` · ${esc(s.objective)}` : ""}</p>
</div></header>
<div class="wrap">
<div class="cards">
<div class="card"><span>Duration</span><strong>${s.minutes} min</strong></div>
<div class="card"><span>Planned RPE</span><strong>${s.rpe || "—"}</strong></div>
<div class="card"><span>Planned load</span><strong>${s.load} AU</strong></div>
<div class="card"><span>Blocks</span><strong>${s.blocks.length}</strong></div>
</div>
${s.blocks
    .map(
      (b, i) => `<div class="block"><h2><span>${i + 1}. ${esc(b.name)}</span><span>${b.minutes} min</span></h2>
${
        b.items.length
          ? `<ol>${b.items.map((it) => `<li>${esc(it.drill)}<em>${esc(it.detail)}</em></li>`).join("")}</ol>`
          : `<p class="empty">Nothing planned in this block yet.</p>`
      }</div>`,
    )
    .join("")}
<p class="note"><strong>How the numbers are calculated.</strong> Duration = the sum of the minutes of every item you placed in the blocks (if no item has minutes yet, the duration saved on the day is used).
RPE = the duration-weighted average of the RPE you set per item (session RPE, Borg CR10 0–10 scale).
Load = RPE × duration, expressed in AU (Arbitrary Units, the standard session-RPE training-load unit). A 66-minute session at RPE 6 = 396 AU.
Load is 0 only when neither an RPE nor minutes have been entered on the items.</p>
<footer><span>Training 4 Performance · training4performance.com</span><span>Generated ${esc(stamp())}</span></footer>
</div></body></html>`;
}

/** Opens the session sheet in a new tab and triggers print-to-PDF. */
export function printSessionSheet(s: SessionSheetPayload) {
  const html = sessionSheetHtml(s);
  const w = window.open("", "_blank");
  if (!w) {
    saveBlob(new Blob([html], { type: "text/html" }), `${slug(s.type)}-${s.date}.html`);
    return false;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}
