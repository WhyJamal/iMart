import * as XLSX from "xlsx";

/**
 * downloadExcel — istalgan qator massivini bitta varaqli .xlsx faylga
 * aylantirib, brauzerda yuklab beradi. Barcha Excel bilan bog'liq
 * joylar (mahsulotlar eksporti, Kirim hujjati shabloni/eksporti) shu
 * bitta funksiyadan foydalanadi.
 */
export function downloadExcel(
  filename: string,
  sheetName: string,
  rows: Record<string, string | number>[]
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

/**
 * readExcelRows — yuklangan Excel faylni o'qib, birinchi varaqdagi
 * qatorlarni JSON obyektlar massivi sifatida qaytaradi (birinchi
 * qator — ustun sarlavhalari sifatida olinadi).
 */
export async function readExcelRows(
  file: File
): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}
