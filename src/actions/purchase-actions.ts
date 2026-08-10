"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreatePurchaseSchema,
  type CreatePurchaseInput,
} from "@/schema/purchase.schema";
import type { ActionResult } from "@/types/action-result.types";
import { TxClient } from "@/types/prisma.types";
import type { TPurchaseItemWithProduct, TPurchaseWithItems } from "@/types/purchase.types";
import type { CashMethod } from "@/types/cash.types";
import { recordCashFlow, reverseCashFlowsByDoc } from "@/actions/cash-actions";
import { applyStockMovement } from "@/actions/stock-actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateReceiptNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PUR-${ts}-${rand}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPurchases() {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const purchases = await prisma.purchase.findMany({
    where: { organizationId: session.organizationId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, code: true } } },
      },
      contragent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return purchases.map((purchase: TPurchaseWithItems) => ({
    ...purchase,
    contragentName: purchase.contragent?.name ?? null,
    items: purchase.items.map((item: TPurchaseItemWithProduct) => ({
      ...item,
      qty: Number(item.qty),
      unitCost: Number(item.unitCost),
    })),
  }));
}

export async function getPurchaseById(id: string) {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const purchase = await prisma.purchase.findUnique({
    where: { id, organizationId: session.organizationId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, code: true, price: true } },
        },
      },
    },
  });

  if (!purchase) return null;  

  return {
    ...purchase,
    items: purchase.items.map((item: TPurchaseItemWithProduct) => ({
      ...item,
      qty: Number(item.qty),
      unitCost: Number(item.unitCost),
    })),
  };
}

/**
 * Current stock level for a single product.
 * Uses the InventoryRegister as the source of truth: SUM(IN) - SUM(OUT).
 */
export async function getProductStock(
  productId: string,
  organizationId: string
): Promise<number> {
  const rows = await prisma.inventoryRegister.groupBy({
    by: ["direction"],
    where: { productId, organizationId },
    _sum: { qty: true },
  });

  let stock = 0;
  for (const row of rows) {
    const val = Number(row._sum.qty ?? 0);
    stock += row.direction === "IN" ? val : -val;
  }
  return stock;
}

/**
 * Stock levels for ALL products in an org.
 * Returns Map<productId, currentQty> — efficient for listing pages.
 */
export async function getOrgStockMap(
  organizationId: string
): Promise<Map<string, number>> {
  const rows = await prisma.inventoryRegister.groupBy({
    by: ["productId", "direction"],
    where: { organizationId },
    _sum: { qty: true },
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    const val = Number(row._sum.qty ?? 0);
    const prev = map.get(row.productId) ?? 0;
    map.set(row.productId, row.direction === "IN" ? prev + val : prev - val);
  }
  return map;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createPurchase(
  input: CreatePurchaseInput
): Promise<ActionResult<{ id: string; receiptNumber: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const parsed = CreatePurchaseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { pointId, contragentId, note, paymentMethod, items } = parsed.data;

    // Verify all products belong to this org
    const productIds = items.map((i) => i.productId);
    const found = await prisma.product.findMany({
      where: { id: { in: productIds }, organizationId: session.organizationId },
      select: { id: true },
    });
    if (found.length !== new Set(productIds).size) {
      return { success: false, error: "One or more products not found" };
    }

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    const contragent = await prisma.contragent.findFirst({
      where: {
        id: contragentId,
        organizationId: session.organizationId,
        type: "SUPPLIER",
      },
    });
    if (!contragent) return { success: false, error: "Sotuvchi (kontragent) topilmadi" };

    // Har bir item'ning yacheykasi shu Point ostidagi skladga tegishli
    // ekanligini tekshiramiz
    const cellIds = items.map((i) => i.warehouseCellId);
    const cells = await prisma.warehouseCell.findMany({
      where: {
        id: { in: cellIds },
        warehouse: { pointId },
      },
      select: { id: true },
    });
    if (cells.length !== new Set(cellIds).size) {
      return {
        success: false,
        error: "Yacheykalardan biri tanlangan nuqtaga tegishli emas",
      };
    }

    const receiptNumber = generateReceiptNumber();

    const totalCost = items.reduce(
      (sum, item) => sum + item.qty * item.unitCost,
      0
    );

    const purchase = await prisma.$transaction(async (tx: TxClient) => {
      const doc = await tx.purchase.create({
        data: {
          receiptNumber,
          organizationId: session.organizationId,
          pointId,
          contragentId,
          note: note?.trim() || null,
          paymentMethod,
          postedAt: new Date(),
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              qty: item.qty,
              unitCost: item.unitCost,
              warehouseCellId: item.warehouseCellId,
            })),
          },
        },
      });

      // Write IN movements to the inventory ledger
      await tx.inventoryRegister.createMany({
        data: items.map((item) => ({
          organizationId: session.organizationId,
          productId: item.productId,
          warehouseCellId: item.warehouseCellId,
          docType: "PURCHASE",
          docId: doc.id,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        })),
      });

      // ItemPrice (o'rtacha narx) va StockBalance (qoldiq+summa)ni yangilash
      for (const item of items) {
        await applyStockMovement(tx, {
          warehouseCellId: item.warehouseCellId,
          productId: item.productId,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        });
      }

      // Write OUT movement to the cash register (taminotchiga tolov)
      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "PURCHASE",
        docId: doc.id,
        direction: "OUT",
        method: paymentMethod.toUpperCase() as CashMethod,
        amount: totalCost,
        createdBy: session.userId,
      });

      return doc;
    });

    revalidatePath("/purchases");
    revalidatePath("/products");
    revalidatePath("/cash");

    return {
      success: true,
      data: { id: purchase.id, receiptNumber: purchase.receiptNumber },
    };
  } catch (err) {
    console.error("[createPurchase]", err);
    return { success: false, error: "Failed to create purchase" };
  }
}

export async function deletePurchase(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const purchase = await prisma.purchase.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!purchase) return { success: false, error: "Purchase not found" };

    await prisma.$transaction(async (tx: TxClient) => {
      const registers = await tx.inventoryRegister.findMany({
        where: { docType: "PURCHASE", docId: id },
      });
      for (const reg of registers) {
        if (!reg.warehouseCellId) continue;
        await applyStockMovement(tx, {
          warehouseCellId: reg.warehouseCellId,
          productId: reg.productId,
          direction: "OUT",
          qty: Number(reg.qty),
          unitCost: Number(reg.unitCost ?? 0),
        });
      }

      await tx.inventoryRegister.deleteMany({
        where: { docType: "PURCHASE", docId: id },
      });
      await reverseCashFlowsByDoc(tx, "PURCHASE", id);
      await tx.purchase.delete({ where: { id } });
    });

    revalidatePath("/purchases");
    revalidatePath("/products");
    revalidatePath("/cash");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deletePurchase]", err);
    return { success: false, error: "Failed to delete purchase" };
  }
}

export async function updatePurchase(
  id: string,
  data: CreatePurchaseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "purchases:create");
    if (denied) return denied;

    const parsed = CreatePurchaseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { pointId, contragentId, note, paymentMethod, items } = parsed.data;

    const existing = await prisma.purchase.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Purchase not found" };

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    const contragent = await prisma.contragent.findFirst({
      where: { id: contragentId, organizationId: session.organizationId, type: "SUPPLIER" },
    });
    if (!contragent) return { success: false, error: "Sotuvchi (kontragent) topilmadi" };

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

    await prisma.$transaction(async (tx: TxClient) => {
      // Eski harakatlarni StockBalance/ItemPrice'dan qaytarib olamiz
      // (aks holda eski va yangi miqdorlar ustma-ust tushib qoladi)
      const oldRegisters = await tx.inventoryRegister.findMany({
        where: { docType: "PURCHASE", docId: id },
      });
      for (const reg of oldRegisters) {
        if (!reg.warehouseCellId) continue;
        await applyStockMovement(tx, {
          warehouseCellId: reg.warehouseCellId,
          productId: reg.productId,
          direction: "OUT", // eski IN'ni bekor qilish uchun teskarisi
          qty: Number(reg.qty),
          unitCost: Number(reg.unitCost ?? 0),
        });
      }

      // Eski itemlar va shu hujjatga tegishli ombor yozuvlarini olib tashlaymiz
      await tx.purchaseItem.deleteMany({ where: { receiptId: id } });
      await tx.inventoryRegister.deleteMany({
        where: { docType: "PURCHASE", docId: id },
      });

      await tx.purchase.update({
        where: { id },
        data: {
          pointId,
          contragentId,
          note: note?.trim() || null,
          paymentMethod,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              qty: item.qty,
              unitCost: item.unitCost,
              warehouseCellId: item.warehouseCellId,
            })),
          },
        },
      });

      await tx.inventoryRegister.createMany({
        data: items.map((item) => ({
          organizationId: session.organizationId,
          productId: item.productId,
          warehouseCellId: item.warehouseCellId,
          docType: "PURCHASE",
          docId: id,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        })),
      });

      for (const item of items) {
        await applyStockMovement(tx, {
          warehouseCellId: item.warehouseCellId,
          productId: item.productId,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        });
      }
    });

    revalidatePath("/purchases");
    revalidatePath("/products");
    revalidatePath("/warehouses");

    return { success: true, data: { id } };
  } catch (err) {
    console.error("[updatePurchase]", err);
    return { success: false, error: "Update failed" };
  }
}