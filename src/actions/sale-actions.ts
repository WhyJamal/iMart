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

    const { items } = parsed.data;

    // ── 1. Fetch products ──────────────────────────────────────────────────
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, organizationId: session.organizationId },
      select: { id: true, name: true },
    });

    if (products.length !== new Set(productIds).size) {
      return { success: false, error: "One or more products not found" };
    }

    // ── 2. Stock check ────────────────────────────────────────────────────
    const stockRows = await prisma.inventoryRegister.groupBy({
      by: ["productId", "direction"],
      where: {
        productId: { in: productIds },
        organizationId: session.organizationId,
      },
      _sum: { qty: true },
    });

    const stockMap = new Map<string, number>();
    for (const row of stockRows) {
      const val = Number(row._sum.qty ?? 0);
      const prev = stockMap.get(row.productId) ?? 0;
      stockMap.set(
        row.productId,
        row.direction === "IN" ? prev + val : prev - val
      );
    }

    for (const item of items) {
      const available = stockMap.get(item.productId) ?? 0;
      if (available < item.qty) {
        const product = products.find((p: IProduct) => p.id === item.productId);
        return {
          success: false,
          error: `Insufficient stock for "${product?.name ?? item.productId}". Available: ${available}`,
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

      // Write OUT movements to the inventory ledger
      await tx.inventoryRegister.createMany({
        data: items.map((item) => ({
          organizationId: session.organizationId,
          productId: item.productId,
          docType: "SALE",
          docId: doc.id,
          direction: "OUT",
          qty: item.qty,
          unitCost: null, // cost not known at POS level
        })),
      });

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