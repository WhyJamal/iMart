import type { TxClient } from "@/types/prisma.types";

/**
 * applyStockMovement — StockBalance (ТоварыНаСкладах) va ItemPrice
 * (ЦенаНоменклатура) registerlarini YANGILAYDI. Bu — tizimdagi
 * BARCHA harakat turlari (Purchase, Sale, SaleReturn, PurchaseReturn)
 * uchun YAGONA markaziy joy. Boshqa hech qayerda bu registerlarga
 * to'g'ridan-to'g'ri yozmang — faqat shu funksiya orqali.
 *
 * Qoida (hammasi uchun bir xil):
 *   IN  -> qty += qty,  amount += qty * unitCost
 *   OUT -> qty -= qty,  amount -= qty * unitCost
 *   keyin: ItemPrice.price = StockBalance.amount / StockBalance.qty
 *
 * `unitCost` — shu HARAKATNING narxi (Purchase uchun xarid narxi,
 * Sale uchun joriy o'rtacha, Return'lar uchun asl hujjatdagi narx —
 * har birini chaqiruvchi action o'zi belgilaydi va kerak bo'lsa
 * foydalanuvchi tomonidan o'zgartirilishi mumkin).
 */
export async function applyStockMovement(
  tx: TxClient,
  params: {
    warehouseCellId: string;
    productId: string;
    direction: "IN" | "OUT";
    qty: number;
    unitCost: number;
  }
): Promise<void> {
  const { warehouseCellId, productId, direction, qty, unitCost } = params;

  const existing = await tx.stockBalance.findUnique({
    where: {
      warehouseCellId_productId: { warehouseCellId, productId },
    },
  });

  const prevQty = existing ? Number(existing.qty) : 0;
  const prevAmount = existing ? Number(existing.amount) : 0;

  const delta = qty * unitCost;
  const nextQty = direction === "IN" ? prevQty + qty : prevQty - qty;
  const nextAmount = direction === "IN" ? prevAmount + delta : prevAmount - delta;

  await tx.stockBalance.upsert({
    where: {
      warehouseCellId_productId: { warehouseCellId, productId },
    },
    create: {
      warehouseCellId,
      productId,
      qty: nextQty,
      amount: nextAmount,
    },
    update: {
      qty: nextQty,
      amount: nextAmount,
    },
  });

  const nextPrice = nextQty > 0 ? nextAmount / nextQty : 0;

  await tx.itemPrice.upsert({
    where: {
      warehouseCellId_productId: { warehouseCellId, productId },
    },
    create: {
      warehouseCellId,
      productId,
      price: nextPrice,
    },
    update: {
      price: nextPrice,
    },
  });
}

/**
 * Bitta (sklad yacheykasi, mahsulot) juftligining hozirgi o'rtacha
 * narxini o'qiydi. Topilmasa 0 qaytaradi (hali hech qachon kirim
 * bo'lmagan degani).
 */
export async function getItemPrice(
  tx: TxClient,
  warehouseCellId: string,
  productId: string
): Promise<number> {
  const row = await tx.itemPrice.findUnique({
    where: {
      warehouseCellId_productId: { warehouseCellId, productId },
    },
  });
  return row ? Number(row.price) : 0;
}
