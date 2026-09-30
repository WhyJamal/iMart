export interface ExportColumn<T> {
  header: string;
  /** Xom qiymat. Excel'ga raqam sifatida yoziladi. */
  value: (row: T) => string | number;
  /** PDF va chop etishda raqamni ko'rsatish formati. */
  format?: (value: number) => string;
  align?: "left" | "right";
}

export interface ReportExportConfig<T> {
  title: string;
  /** Masalan tanlangan filtrlar: "Nuqta: Chilonzor · Ombor: Asosiy" */
  subtitle?: string;
  /** Kengaytmasiz fayl nomi. Sana avtomatik qo'shiladi. */
  fileName: string;
  columns: ExportColumn<T>[];
  rows: T[];
  /** Ustunlarga mos "Jami" qatori. Bo'sh ustun uchun null. */
  footer?: (string | number | null)[];
  orientation?: "portrait" | "landscape";
}

export interface ExportLabels {
  generatedAt: string;
  page: string;
}

const PDF_FONT_URL = "/fonts/NotoSans-Regular.ttf";

const stamp = () => new Date().toISOString().slice(0, 10);

function cellText<T>(col: ExportColumn<T>, v: string | number | null | undefined) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return col.format ? col.format(v) : String(v);
  return v;
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ─── Excel ────────────────────────────────────────────────────────────────────

export async function exportToExcel<T>(cfg: ReportExportConfig<T>) {
  const XLSX = await import("xlsx");

  const aoa: (string | number)[][] = [[cfg.title]];
  if (cfg.subtitle) aoa.push([cfg.subtitle]);
  aoa.push([]);
  aoa.push(cfg.columns.map((c) => c.header));

  for (const row of cfg.rows) {
    aoa.push(cfg.columns.map((c) => c.value(row)));
  }
  if (cfg.footer) {
    aoa.push(cfg.columns.map((_, i) => cfg.footer![i] ?? ""));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = cfg.columns.map((c) => ({
    wch: Math.min(
      40,
      Math.max(
        c.header.length,
        ...cfg.rows.slice(0, 200).map((r) => String(c.value(r)).length)
      ) + 2
    ),
  }));

  const wb = XLSX.utils.book_new();
  const sheetName = cfg.title.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Report";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${cfg.fileName}-${stamp()}.xlsx`);
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

let fontCache: string | null = null;

async function loadPdfFont(): Promise<string> {
  if (fontCache) return fontCache;

  const res = await fetch(PDF_FONT_URL);
  if (!res.ok) throw new Error(`PDF font not found: ${PDF_FONT_URL}`);

  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  fontCache = btoa(bin);
  return fontCache;
}

export async function exportToPdf<T>(
  cfg: ReportExportConfig<T>,
  labels: ExportLabels
) {
  const [{ jsPDF }, { default: autoTable }, font] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadPdfFont(),
  ]);

  const doc = new jsPDF({
    orientation: cfg.orientation ?? "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.addFileToVFS("report-font.ttf", font);
  doc.addFont("report-font.ttf", "ReportFont", "normal");
  doc.setFont("ReportFont", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(14);
  doc.text(cfg.title, 14, 14);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `${labels.generatedAt}: ${new Date().toLocaleString()}`,
    pageWidth - 14,
    14,
    { align: "right" }
  );

  let startY = 19;
  if (cfg.subtitle) {
    doc.setFontSize(9);
    doc.text(cfg.subtitle, 14, 20);
    startY = 24;
  }
  doc.setTextColor(0);

  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14 },
    head: [cfg.columns.map((c) => c.header)],
    body: cfg.rows.map((r) => cfg.columns.map((c) => cellText(c, c.value(r)))),
    foot: cfg.footer
      ? [cfg.columns.map((c, i) => cellText(c, cfg.footer![i] ?? null))]
      : undefined,
    showFoot: "lastPage",
    styles: { font: "ReportFont", fontStyle: "normal", fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "normal" },
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "normal" },
    columnStyles: Object.fromEntries(
      cfg.columns.map((c, i): [number, { halign: "left" | "right" }] => [
        i,
        { halign: c.align ?? "left" },
      ])
    ),
  });

  const total = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(120);
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.text(`${labels.page} ${i} / ${total}`, pageWidth - 14, pageHeight - 6, {
      align: "right",
    });
  }

  doc.save(`${cfg.fileName}-${stamp()}.pdf`);
}

// ─── Print ────────────────────────────────────────────────────────────────────

export function printReport<T>(cfg: ReportExportConfig<T>, labels: ExportLabels) {
  const cls = (c: ExportColumn<T>) => (c.align === "right" ? ' class="r"' : "");

  const head = cfg.columns
    .map((c) => `<th${cls(c)}>${escapeHtml(c.header)}</th>`)
    .join("");

  const body = cfg.rows
    .map(
      (r) =>
        `<tr>${cfg.columns
          .map((c) => `<td${cls(c)}>${escapeHtml(cellText(c, c.value(r)))}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const foot = cfg.footer
    ? `<tfoot><tr>${cfg.columns
        .map(
          (c, i) =>
            `<td${cls(c)}>${escapeHtml(cellText(c, cfg.footer![i] ?? null))}</td>`
        )
        .join("")}</tr></tfoot>`
    : "";

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(cfg.title)}</title>
<style>
  @page { size: A4 ${cfg.orientation ?? "landscape"}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #111; font-size: 11px; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  .meta { display: flex; justify-content: space-between; gap: 12px; color: #555; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
  th { background: #f0f0f0; }
  .r { text-align: right; white-space: nowrap; }
  thead { display: table-header-group; }
  tfoot { display: table-row-group; }
  tfoot td { font-weight: 600; background: #f0f0f0; }
  tr { break-inside: avoid; }
</style>
</head>
<body>
  <h1>${escapeHtml(cfg.title)}</h1>
  <div class="meta">
    <span>${escapeHtml(cfg.subtitle ?? "")}</span>
    <span>${escapeHtml(labels.generatedAt)}: ${escapeHtml(new Date().toLocaleString())}</span>
  </div>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
    ${foot}
  </table>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });

  iframe.onload = () => {
    const w = iframe.contentWindow;
    if (!w) return;
    w.addEventListener("afterprint", () => iframe.remove());
    w.focus();
    w.print();
    window.setTimeout(() => iframe.remove(), 60_000);
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}