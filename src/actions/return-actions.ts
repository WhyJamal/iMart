"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  CreateSaleReturnSchema,
  type CreateSaleReturnInput,
} from "@/schema/return.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type {
  TSaleReturnWithItems,
  TSerializedSaleReturn,
  ISaleForReturn,
} from "@/types/return.types";
import type { CashMethod } from "@/types/cash.types";
import { recordCashFlow, reverseCashFlowsByDoc } from "@/actions/cash-actions";
import type { SaleItem } from "@/generated/prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateReturnNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RET-${ts}-${rand}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSaleReturns(): Promise<TSerializedSaleReturn[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const returns = await prisma.saleReturn.findMany({
    where: { organizationId: session.organizationId },
    include: {
      sale: { select: { id: true, saleNumber: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (returns as TSaleReturnWithItems[]).map((r) => ({
    ...r,
    totalAmount: Number(r.totalAmount),
    items: r.items.map((item: TSaleReturnWithItems["items"][number]) => ({
      ...item,
      qty: Number(item.qty),
      unitPrice: Number(item.unitPrice),
    })),
  }));
}

/**
 * Chek raqami (saleNumber) bo'yicha sotuvni topadi va har bir
 * SaleItem uchun avval qancha qaytarilgani + hali qancha qaytarish
 * mumkinligini hisoblab qaytaradi. POS/Return formasi shu bilan
 * ishlaydi.
 */
export async function findSaleForReturn(
  saleNumber: string
): Promise<ISaleForReturn | null> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const sale = await prisma.sale.findFirst({
    where: {
      saleNumber: saleNumber.trim(),
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
  if (!sale) return null;

  const saleItemIds = sale.items.map((i: SaleItem) => i.id);

  const returnedRows = await prisma.saleReturnItem.findMany({
    where: { saleItemId: { in: saleItemIds } },
    select: { saleItemId: true, qty: true },
  });

  const returnedMap = new Map<string, number>();
  for (const row of returnedRows) {
    returnedMap.set(
      row.saleItemId,
      (returnedMap.get(row.saleItemId) ?? 0) + Number(row.qty)
    );
  }

  return {
    id: sale.id,
    saleNumber: sale.saleNumber,
    createdAt: sale.createdAt,
    items: sale.items.map((item: SaleItem & { product: { id: string; name: string; code: string } }) => {
      const qty = Number(item.qty);
      const returnedQty = returnedMap.get(item.id) ?? 0;
      return {
        id: item.id,
        productId: item.productId,
        qty,
        unitPrice: Number(item.unitPrice),
        returnedQty,
        returnableQty: Math.max(0, qty - returnedQty),
        product: item.product,
      };
    }),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * createSaleReturn — chekni qaytarish (Возврат товара).
 *
 * Steps (bitta tranzaksiyada):
 *  1. Zod bilan input tekshiriladi.
 *  2. Sotuv (Sale) va uning SaleItem'lari tashkilotga tegishliligi
 *     tekshiriladi, avval qaytarilgan miqdor hisobga olinib
 *     "ortiqcha qaytarish"ning oldi olinadi.
 *  3. SaleReturn + SaleReturnItem yaratiladi.
 *  4. InventoryRegister'ga direction: "IN" yozuvi qo'shiladi — tovar
 *     omborga qaytadi.
 *  5. recordCashFlow() orqali pul mijozga qaytariladi
 *     (docType: "SALE_RETURN", direction: "OUT") — kassa yoki bank
 *     balansidan avtomatik ayiriladi.
 */
export async function createSaleReturn(
  input: CreateSaleReturnInput
): Promise<ActionResult<{ id: string; returnNumber: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const parsed = CreateSaleReturnSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { saleId, reason, paymentMethod, items } = parsed.data;

    // ── 1. Sotuvni va uning itemlarini tekshirish ───────────────────────
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, organizationId: session.organizationId },
      include: { items: true },
    });
    if (!sale) return { success: false, error: "Sale not found" };

    const saleItemIds = items.map((i) => i.saleItemId);
    const saleItems = sale.items.filter((si: SaleItem) => saleItemIds.includes(si.id));
    if (saleItems.length !== new Set(saleItemIds).size) {
      return { success: false, error: "One or more sale items not found" };
    }

    // ── 2. Avval qaytarilgan miqdorni hisoblash ─────────────────────────
    const alreadyReturned = await prisma.saleReturnItem.findMany({
      where: { saleItemId: { in: saleItemIds } },
      select: { saleItemId: true, qty: true },
    });
    const returnedMap = new Map<string, number>();
    for (const r of alreadyReturned) {
      returnedMap.set(
        r.saleItemId,
        (returnedMap.get(r.saleItemId) ?? 0) + Number(r.qty)
      );
    }

    let totalAmount = 0;
    for (const item of items) {
      const saleItem = saleItems.find((si: SaleItem) => si.id === item.saleItemId)!;
      const alreadyQty = returnedMap.get(item.saleItemId) ?? 0;
      const remaining = Number(saleItem.qty) - alreadyQty;

      if (item.qty > remaining) {
        return {
          success: false,
          error: `Cannot return more than sold. Remaining returnable qty: ${remaining}`,
        };
      }

      totalAmount += item.qty * Number(saleItem.unitPrice);
    }

    const returnNumber = generateReturnNumber();

    // ── 3. Persist — bitta tranzaksiyada ────────────────────────────────
    const saleReturn = await prisma.$transaction(async (tx: TxClient) => {
      const doc = await tx.saleReturn.create({
        data: {
          returnNumber,
          organizationId: session.organizationId,
          saleId: sale.id,
          reason: reason ?? null,
          paymentMethod,
          totalAmount,
          createdBy: session.userId,
          items: {
            create: items.map((item) => {
              const saleItem = saleItems.find(
                (si: SaleItem) => si.id === item.saleItemId
              )!;
              return {
                saleItemId: item.saleItemId,
                productId: saleItem.productId,
                qty: item.qty,
                unitPrice: Number(saleItem.unitPrice),
              };
            }),
          },
        },
      });

      // Tovar omborga qaytadi (IN)
      await tx.inventoryRegister.createMany({
        data: items.map((item) => {
          const saleItem = saleItems.find(
            (si: SaleItem) => si.id === item.saleItemId
          )!;
          return {
            organizationId: session.organizationId,
            productId: saleItem.productId,
            docType: "SALE_RETURN",
            docId: doc.id,
            direction: "IN",
            qty: item.qty,
            unitCost: null,
          };
        }),
      });

      // Pul mijozga qaytariladi — kassa/bank balansidan chiqim (OUT)
      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "SALE_RETURN",
        docId: doc.id,
        direction: "OUT",
        method: paymentMethod.toUpperCase() as CashMethod,
        amount: totalAmount,
        note: reason ?? undefined,
        createdBy: session.userId,
      });

      return doc;
    });

    revalidatePath("/returns");
    revalidatePath("/sales");
    revalidatePath("/products");
    revalidatePath("/cash");

    return {
      success: true,
      data: { id: saleReturn.id, returnNumber: saleReturn.returnNumber },
    };
  } catch (err) {
    console.error("[createSaleReturn]", err);
    return { success: false, error: "Failed to create return" };
  }
}

export async function deleteSaleReturn(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const saleReturn = await prisma.saleReturn.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!saleReturn) return { success: false, error: "Return not found" };

    await prisma.$transaction(async (tx: TxClient) => {
      await tx.inventoryRegister.deleteMany({
        where: { docType: "SALE_RETURN", docId: id },
      });
      await reverseCashFlowsByDoc(tx, "SALE_RETURN", id);
      await tx.saleReturn.delete({ where: { id } });
    });

    revalidatePath("/returns");
    revalidatePath("/sales");
    revalidatePath("/products");
    revalidatePath("/cash");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteSaleReturn]", err);
    return { success: false, error: "Failed to delete return" };
  }
}
