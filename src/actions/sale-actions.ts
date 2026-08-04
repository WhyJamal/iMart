"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { CreateSaleSchema, type CreateSaleInput } from "@/schema/sale.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type { IProduct } from "@/types/product.types";
import type { TSaleWithItems, TSerializedSale } from "@/types/sale.types";
import type { CashMethod } from "@/types/cash.types";
import { recordCashFlow, reverseCashFlowsByDoc } from "@/actions/cash-actions";
import { getPointStockMap, getSellableCellsForProduct } from "@/actions/warehouse-actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSaleNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SALE-${ts}-${rand}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSales(): Promise<TSerializedSale[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const sales = await prisma.sale.findMany({
    where: {
      organizationId: session.organizationId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (sales as TSaleWithItems[]).map((sale) => ({
    ...sale,
    totalAmount: Number(sale.totalAmount),
    items: sale.items.map((item) => ({
      ...item,
      qty: Number(item.qty),
      unitPrice: Number(item.unitPrice),
    })),
  }));
}

export async function getSaleById(id: string) {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.sale.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * createSale — used by both the POS terminal and the manual sale page.
 *
 * Steps (inside one transaction):
 *  1. Validate input with zod.
 *  2. Verify every product belongs to the org.
 *  3. Check stock sufficiency for every item.
 *  4. Create Sale + SaleItems.
 *  5. Write OUT movements to InventoryRegister.
 */
export async function createSale(
  input: CreateSaleInput
): Promise<ActionResult<{ id: string; saleNumber: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const parsed = CreateSaleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { pointId, items } = parsed.data;

    // ── 1. Fetch products ──────────────────────────────────────────────────
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, organizationId: session.organizationId },
      select: { id: true, name: true },
    });

    if (products.length !== new Set(productIds).size) {
      return { success: false, error: "One or more products not found" };
    }

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    // ── 2. Stock check (shu Point ostidagi skladlar bo'yicha) ──────────────
    const stockMap = await getPointStockMap(pointId);

    for (const item of items) {
      const available = stockMap.get(item.productId) ?? 0;
      if (available < item.qty) {
        const product = products.find((p: IProduct) => p.id === item.productId);
        return {
          success: false,
          error: `Insufficient stock for "${product?.name ?? item.productId}" at this point. Available: ${available}`,
        };
      }
    }

    // // ── 3. Calculate total ────────────────────────────────────────────────
    // const totalAmount = items.reduce(
    //   (sum, item) => sum + item.qty * item.unitPrice,
    //   0
    // );

    const saleNumber = generateSaleNumber();

    // ── 4. Persist ────────────────────────────────────────────────────────
    const sale = await prisma.$transaction(async (tx: TxClient) => {
      const doc = await tx.sale.create({
        data: {
          saleNumber,
          organizationId: session.organizationId,
          cashierId: session.userId ?? null,
          pointId,
          totalAmount: parsed.data.totalAmount,
          paymentMethod: parsed.data.paymentMethod,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              qty: item.qty,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      // Har bir mahsulot uchun Point ostidagi yacheykalardan "greedy"
      // usulda yechib, har biriga alohida OUT yozuvi yoziladi.
      for (const item of items) {
        const cells = await getSellableCellsForProduct(
          pointId,
          item.productId,
          tx
        );

        let remaining = item.qty;
        for (const cell of cells) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, cell.available);
          await tx.inventoryRegister.create({
            data: {
              organizationId: session.organizationId,
              productId: item.productId,
              warehouseCellId: cell.warehouseCellId,
              docType: "SALE",
              docId: doc.id,
              direction: "OUT",
              qty: take,
              unitCost: null,
            },
          });
          remaining -= take;
        }

        if (remaining > 0) {
          // Stock check yuqorida o'tgan bo'lsa ham, race condition
          // ehtimoliga qarshi xavfsizlik uchun.
          throw new Error(
            `Insufficient stock for product ${item.productId} at this point`
          );
        }
      }

      // Write IN movement to the cash register (kassa)
      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "SALE",
        docId: doc.id,
        direction: "IN",
        method: parsed.data.paymentMethod.toUpperCase() as CashMethod,
        amount: parsed.data.totalAmount,
        createdBy: session.userId,
      });

      return doc;
    });

    revalidatePath("/sales");
    revalidatePath("/products");
    revalidatePath("/cash");

    return {
      success: true,
      data: { id: sale.id, saleNumber: sale.saleNumber },
    };
  } catch (err) {
    console.error("[createSale]", err);
    return { success: false, error: "Failed to create sale" };
  }
}

export async function deleteSale(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const sale = await prisma.sale.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!sale) return { success: false, error: "Sale not found" };

    await prisma.$transaction(async (tx: TxClient) => {
      await tx.inventoryRegister.deleteMany({
        where: { docType: "SALE", docId: id },
      });
      await reverseCashFlowsByDoc(tx, "SALE", id);
      await tx.sale.delete({ where: { id } });
    });

    revalidatePath("/sales");
    revalidatePath("/products");
    revalidatePath("/cash");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteSale]", err);
    return { success: false, error: "Failed to delete sale" };
  }
}