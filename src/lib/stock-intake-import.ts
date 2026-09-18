export interface ParsedIntakeRow {
  productId: string;
  productName: string;
  qty: number;
  unitCost: number | null;
}

interface CatalogProduct {
  id: string;
  code: string;
  name: string;
}

function normalize(v: unknown): string {
  return String(v ?? "").trim().toLocaleLowerCase("ru-RU");
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * matchIntakeExcelRows — Excel'dan o'qilgan xom qatorlarni (readExcelRows
 * natijasi) mavjud NOMENKLATURAGA moslashtiradi. Avval KOD bo'yicha
 * qidiradi (aniqroq), topilmasa NOM bo'yicha (normallashtirilgan:
 * bo'shliqlar tozalanadi, kichik harf). Mos kelmagan qatorlar
 * `unmatched`da qaytariladi — chaqiruvchi tomon buni toast orqali
 * ko'rsatadi, bu qatorlar hujjatga QO'SHILMAYDI.
 *
 * `labels` — shablon eksportida ishlatilgan ustun sarlavhalari (joriy
 * tilga mos), chunki foydalanuvchi aynan o'sha faylni to'ldirib
 * yuklaydi.
 */
export function matchIntakeExcelRows(
  rows: Record<string, unknown>[],
  products: CatalogProduct[],
  labels: { code: string; name: string; qty: string; price: string }
): { matched: ParsedIntakeRow[]; unmatched: string[] } {
  const byCode = new Map(products.map((p) => [normalize(p.code), p]));
  const byName = new Map(products.map((p) => [normalize(p.name), p]));

  const matched: ParsedIntakeRow[] = [];
  const unmatched: string[] = [];

  for (const row of rows) {
    const codeRaw = row[labels.code];
    const nameRaw = row[labels.name];
    const qty = toNumber(row[labels.qty]);
    const priceRaw = row[labels.price];

    if (!qty || qty <= 0) continue; // bo'sh qatorlarni o'tkazib yuboramiz

    const code = normalize(codeRaw);
    const name = normalize(nameRaw);

    const product = (code && byCode.get(code)) || (name && byName.get(name));

    if (!product) {
      unmatched.push(String(nameRaw || codeRaw || "?"));
      continue;
    }

    const price = priceRaw === "" || priceRaw === undefined ? null : toNumber(priceRaw);

    matched.push({
      productId: product.id,
      productName: product.name,
      qty,
      unitCost: price,
    });
  }

  return { matched, unmatched };
}
