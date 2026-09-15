import type { TxClient } from "@/types/prisma.types";
import { notifyUsers } from "@/actions/notification-actions";

/**
 * checkLowStockAndNotify — OUT harakatidan keyin shu mahsulotning
 * TASHKILOT bo'yicha (barcha skladlar yig'indisi) umumiy qoldig'ini
 * Product.minStock bilan solishtiradi. Faqat chegaradan "kesib
 * o'tgan" paytda (avval yuqori edi, endi past/teng bo'ldi) bitta marta
 * ogohlantiradi — har safar sotuvda qayta-qayta yubormaslik uchun.
 * minStock = 0 bo'lsa — bu mahsulot uchun ogohlantirish o'chirilgan.
 */
async function checkLowStockAndNotify(
  tx: TxClient,
  productId: string,
  qtyJustRemoved: number
): Promise<void> {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, organizationId: true, minStock: true },
  });
  if (!product || Number(product.minStock) <= 0) return;

  const totals = await tx.stockBalance.aggregate({
    where: { productId },
    _sum: { qty: true },
  });
  const nextTotal = Number(totals._sum.qty ?? 0);
  const prevTotal = nextTotal + qtyJustRemoved;
  const minStock = Number(product.minStock);

  // Faqat chegaradan endi o'tgan bo'lsa (avval yuqori, endi past/teng)
  if (!(prevTotal > minStock && nextTotal <= minStock)) return;

  const managers = await tx.organizationMember.findMany({
    where: { organizationId: product.organizationId, role: { in: ["OWNER", "ADMIN"] } },
    select: { userId: true },
  });

  await notifyUsers({
    organizationId: product.organizationId,
    userIds: managers.map((m: { userId: string }) => m.userId),
    type: "LOW_STOCK",
    title: "Qoldiq kam qoldi",
    message: `"${product.name}" mahsulotining umumiy qoldig'i ${nextTotal} ga tushdi (minimal: ${minStock}).`,
    link: "/products",
  });
}

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

  if (direction === "OUT") {
    await checkLowStockAndNotify(tx, productId, qty);
  }
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
