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
import { applyStockMovement, getItemPrice } from "@/actions/stock-actions";

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
 *  3. Verify every item's warehouseCellId belongs to a warehouse under
 *     the selected Point, and has enough stock — EXACTLY the cell the
 *     cashier chose (or auto-selected) in the POS UI, no substitution.
 *  4. Create Sale + SaleItems (with warehouseCellId).
 *  5. Write OUT movements to InventoryRegister — one row per item,
 *     against that specific cell.
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

    // ── 2. Har bir item'ning tanlangan yacheykasi shu Point ostidagi
    // skladga tegishli ekanligini tekshiramiz ──────────────────────────────
    const cellIds = items.map((i) => i.warehouseCellId);
    const cells = await prisma.warehouseCell.findMany({
      where: { id: { in: cellIds }, warehouse: { pointId } },
      select: { id: true },
    });
    if (cells.length !== new Set(cellIds).size) {
      return {
        success: false,
        error: "Yacheykalardan biri tanlangan nuqtaga tegishli emas",
      };
    }

    // ── 3. Har bir tanlangan yacheykaning joriy qoldig'ini tekshiramiz ─────
    const cellStockRows = await prisma.inventoryRegister.groupBy({
      by: ["warehouseCellId", "direction"],
      where: { warehouseCellId: { in: cellIds } },
      _sum: { qty: true },
    });
    const cellStockMap = new Map<string, number>();
    for (const row of cellStockRows) {
      if (!row.warehouseCellId) continue;
      const val = Number(row._sum.qty ?? 0);
      const prev = cellStockMap.get(row.warehouseCellId) ?? 0;
      cellStockMap.set(
        row.warehouseCellId,
        row.direction === "IN" ? prev + val : prev - val
      );
    }

    for (const item of items) {
      const available = cellStockMap.get(item.warehouseCellId) ?? 0;
      if (available < item.qty) {
        const product = products.find((p: IProduct) => p.id === item.productId);
        return {
          success: false,
          error: `Insufficient stock for "${product?.name ?? item.productId}" in the selected cell. Available: ${available}`,
        };
      }
    }

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
              warehouseCellId: item.warehouseCellId,
            })),
          },
        },
      });

      // Har bir item — kassir POS'da aniq tanlagan (yoki avtomatik
      // tanlangan) bitta yacheykadan yechiladi. Boshqa yacheykaga
      // "sakrash" yo'q. unitCost — shu yacheykadagi JORIY o'rtacha
      // tannarx (ItemPrice) — endi null qoldirilmaydi.
      for (const item of items) {
        const currentCost = await getItemPrice(
          tx,
          item.warehouseCellId,
          item.productId
        );

        await tx.inventoryRegister.create({
          data: {
            organizationId: session.organizationId,
            productId: item.productId,
            warehouseCellId: item.warehouseCellId,
            docType: "SALE",
            docId: doc.id,
            direction: "OUT",
            qty: item.qty,
            unitCost: currentCost,
          },
        });

        await applyStockMovement(tx, {
          warehouseCellId: item.warehouseCellId,
          productId: item.productId,
          direction: "OUT",
          qty: item.qty,
          unitCost: currentCost,
        });
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
      const registers = await tx.inventoryRegister.findMany({
        where: { docType: "SALE", docId: id },
      });
      for (const reg of registers) {
        if (!reg.warehouseCellId) continue;
        await applyStockMovement(tx, {
          warehouseCellId: reg.warehouseCellId,
          productId: reg.productId,
          direction: "IN", // eski OUT'ni bekor qilish uchun teskarisi
          qty: Number(reg.qty),
          unitCost: Number(reg.unitCost ?? 0),
        });
      }

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
