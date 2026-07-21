"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  CreatePurchaseReturnSchema,
  type CreatePurchaseReturnInput,
} from "@/schema/purchase-return.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type {
  TPurchaseReturnWithItems,
  TSerializedPurchaseReturn,
  IPurchaseForReturn,
} from "@/types/purchase-return.types";
import type { CashMethod } from "@/types/cash.types";
import { recordCashFlow, reverseCashFlowsByDoc } from "@/actions/cash-actions";
import type { PurchaseItem } from "@/generated/prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateReturnNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PRET-${ts}-${rand}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPurchaseReturns(): Promise<
  TSerializedPurchaseReturn[]
> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const returns = await prisma.purchaseReturn.findMany({
    where: { organizationId: session.organizationId },
    include: {
      purchase: {
        select: { id: true, receiptNumber: true, supplierName: true },
      },
      items: {
        include: {
          product: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (returns as TPurchaseReturnWithItems[]).map((r) => ({
    ...r,
    totalAmount: Number(r.totalAmount),
    items: r.items.map((item: TPurchaseReturnWithItems["items"][number]) => ({
      ...item,
      qty: Number(item.qty),
      unitCost: Number(item.unitCost),
    })),
  }));
}

/**
 * Xarid cheki raqami (receiptNumber) bo'yicha xaridni topadi va har
 * bir PurchaseItem uchun avval qancha qaytarilgani + hali qancha
 * qaytarish mumkinligini (jismoniy ombordagi qoldiq bilan cheklab)
 * hisoblab qaytaradi.
 */
export async function findPurchaseForReturn(
  receiptNumber: string
): Promise<IPurchaseForReturn | null> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const purchase = await prisma.purchase.findFirst({
    where: {
      receiptNumber: receiptNumber.trim(),
      organizationId: session.organizationId,
    },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });
  if (!purchase) return null;

  const purchaseItemIds = purchase.items.map((i: PurchaseItem) => i.id);

  // Shu xariddan avval qancha qaytarilgan
  const returnedRows = await prisma.purchaseReturnItem.findMany({
    where: { purchaseItemId: { in: purchaseItemIds } },
    select: { purchaseItemId: true, qty: true },
  });
  const returnedMap = new Map<string, number>();
  for (const row of returnedRows) {
    returnedMap.set(
      row.purchaseItemId,
      (returnedMap.get(row.purchaseItemId) ?? 0) + Number(row.qty)
    );
  }

  // Ombordagi joriy qoldiq (SUM(IN) - SUM(OUT)) — ba'zi tovar allaqachon
  // sotilgan bo'lishi mumkin, shuning uchun qaytarish faqat mavjud
  // qoldiq doirasida ruxsat etiladi.
  const productIds = purchase.items.map((i: PurchaseItem) => i.productId);
  const stockRows = await prisma.inventoryRegister.groupBy({
    by: ["productId", "direction"],
    where: { productId: { in: productIds }, organizationId: session.organizationId },
    _sum: { qty: true },
  });
  const stockMap = new Map<string, number>();
  for (const row of stockRows) {
    const val = Number(row._sum.qty ?? 0);
    const prev = stockMap.get(row.productId) ?? 0;
    stockMap.set(row.productId, row.direction === "IN" ? prev + val : prev - val);
  }

  return {
    id: purchase.id,
    receiptNumber: purchase.receiptNumber,
    supplierName: purchase.supplierName,
    createdAt: purchase.createdAt,
    items: purchase.items.map(
      (item: PurchaseItem & { product: { id: string; name: string; code: string } }) => {
        const qty = Number(item.qty);
        const returnedQty = returnedMap.get(item.id) ?? 0;
        const currentStock = stockMap.get(item.productId) ?? 0;
        // Shu qatordan qaytarish mumkin bo'lgan maksimal miqdor —
        // "hali qaytarilmagan" va "ombordagi joriy qoldiq"ning kichigi
        const returnableQty = Math.max(
          0,
          Math.min(qty - returnedQty, currentStock)
        );
        return {
          id: item.id,
          productId: item.productId,
          qty,
          unitCost: Number(item.unitCost),
          returnedQty,
          returnableQty,
          product: item.product,
        };
      }
    ),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * createPurchaseReturn — do'kon ta'minotchiga tovarni qaytaradi
 * (masalan, eskirgan/nosoz/shartnomaga mos kelmagan tovar uchun).
 *
 * Steps (bitta tranzaksiyada):
 *  1. Zod bilan input tekshiriladi.
 *  2. Xarid (Purchase) va uning PurchaseItem'lari tashkilotga
 *     tegishliligi tekshiriladi; avval qaytarilgan miqdor va joriy
 *     ombor qoldig'i hisobga olinib "ortiqcha qaytarish"ning oldi
 *     olinadi.
 *  3. PurchaseReturn + PurchaseReturnItem yaratiladi.
 *  4. InventoryRegister'ga direction: "OUT" yozuvi qo'shiladi — tovar
 *     ombordan chiqadi (ta'minotchiga jo'natiladi).
 *  5. recordCashFlow() orqali pul ta'minotchidan qaytariladi
 *     (docType: "PURCHASE_RETURN", direction: "IN") — kassa yoki
 *     bank balansiga avtomatik qo'shiladi.
 */
export async function createPurchaseReturn(
  input: CreatePurchaseReturnInput
): Promise<ActionResult<{ id: string; returnNumber: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const parsed = CreatePurchaseReturnSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { purchaseId, reason, paymentMethod, items } = parsed.data;

    // ── 1. Xaridni va uning itemlarini tekshirish ───────────────────────
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, organizationId: session.organizationId },
      include: { items: true },
    });
    if (!purchase) return { success: false, error: "Purchase not found" };

    const purchaseItemIds = items.map((i) => i.purchaseItemId);
    const purchaseItems = purchase.items.filter((pi: PurchaseItem) =>
      purchaseItemIds.includes(pi.id)
    );
    if (purchaseItems.length !== new Set(purchaseItemIds).size) {
      return { success: false, error: "One or more purchase items not found" };
    }

    // ── 2. Avval qaytarilgan miqdor ─────────────────────────────────────
    const alreadyReturned = await prisma.purchaseReturnItem.findMany({
      where: { purchaseItemId: { in: purchaseItemIds } },
      select: { purchaseItemId: true, qty: true },
    });
    const returnedMap = new Map<string, number>();
    for (const r of alreadyReturned) {
      returnedMap.set(
        r.purchaseItemId,
        (returnedMap.get(r.purchaseItemId) ?? 0) + Number(r.qty)
      );
    }

    // ── 3. Ombordagi joriy qoldiq ────────────────────────────────────────
    const productIds = purchaseItems.map((pi: PurchaseItem) => pi.productId);
    const stockRows = await prisma.inventoryRegister.groupBy({
      by: ["productId", "direction"],
      where: { productId: { in: productIds }, organizationId: session.organizationId },
      _sum: { qty: true },
    });
    const stockMap = new Map<string, number>();
    for (const row of stockRows) {
      const val = Number(row._sum.qty ?? 0);
      const prev = stockMap.get(row.productId) ?? 0;
      stockMap.set(row.productId, row.direction === "IN" ? prev + val : prev - val);
    }

    let totalAmount = 0;
    for (const item of items) {
      const purchaseItem = purchaseItems.find(
        (pi: PurchaseItem) => pi.id === item.purchaseItemId
      )!;
      const alreadyQty = returnedMap.get(item.purchaseItemId) ?? 0;
      const remaining = Number(purchaseItem.qty) - alreadyQty;

      if (item.qty > remaining) {
        return {
          success: false,
          error: `Cannot return more than purchased. Remaining returnable qty: ${remaining}`,
        };
      }

      const currentStock = stockMap.get(purchaseItem.productId) ?? 0;
      if (item.qty > currentStock) {
        return {
          success: false,
          error: `Not enough stock to return. Current stock: ${currentStock}`,
        };
      }

      totalAmount += item.qty * Number(purchaseItem.unitCost);
    }

    const returnNumber = generateReturnNumber();

    // ── 4. Persist — bitta tranzaksiyada ────────────────────────────────
    const purchaseReturn = await prisma.$transaction(async (tx: TxClient) => {
      const doc = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          organizationId: session.organizationId,
          purchaseId: purchase.id,
          reason: reason ?? null,
          paymentMethod,
          totalAmount,
          createdBy: session.userId,
          items: {
            create: items.map((item) => {
              const purchaseItem = purchaseItems.find(
                (pi: PurchaseItem) => pi.id === item.purchaseItemId
              )!;
              return {
                purchaseItemId: item.purchaseItemId,
                productId: purchaseItem.productId,
                qty: item.qty,
                unitCost: Number(purchaseItem.unitCost),
              };
            }),
          },
        },
      });

      // Tovar ombordan chiqadi — ta'minotchiga jo'natiladi (OUT)
      await tx.inventoryRegister.createMany({
        data: items.map((item) => {
          const purchaseItem = purchaseItems.find(
            (pi: PurchaseItem) => pi.id === item.purchaseItemId
          )!;
          return {
            organizationId: session.organizationId,
            productId: purchaseItem.productId,
            docType: "PURCHASE_RETURN",
            docId: doc.id,
            direction: "OUT",
            qty: item.qty,
            unitCost: purchaseItem.unitCost,
          };
        }),
      });

      // Pul ta'minotchidan qaytariladi — kassa/bank balansiga kirim (IN)
      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "PURCHASE_RETURN",
        docId: doc.id,
        direction: "IN",
        method: paymentMethod.toUpperCase() as CashMethod,
        amount: totalAmount,
        note: reason ?? undefined,
        createdBy: session.userId,
      });

      return doc;
    });

    revalidatePath("/purchase-returns");
    revalidatePath("/purchases");
    revalidatePath("/products");
    revalidatePath("/cash");

    return {
      success: true,
      data: { id: purchaseReturn.id, returnNumber: purchaseReturn.returnNumber },
    };
  } catch (err) {
    console.error("[createPurchaseReturn]", err);
    return { success: false, error: "Failed to create purchase return" };
  }
}

export async function deletePurchaseReturn(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const purchaseReturn = await prisma.purchaseReturn.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!purchaseReturn) return { success: false, error: "Return not found" };

    await prisma.$transaction(async (tx: TxClient) => {
      await tx.inventoryRegister.deleteMany({
        where: { docType: "PURCHASE_RETURN", docId: id },
      });
      await reverseCashFlowsByDoc(tx, "PURCHASE_RETURN", id);
      await tx.purchaseReturn.delete({ where: { id } });
    });

    revalidatePath("/purchase-returns");
    revalidatePath("/purchases");
    revalidatePath("/products");
    revalidatePath("/cash");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deletePurchaseReturn]", err);
    return { success: false, error: "Failed to delete purchase return" };
  }
}
