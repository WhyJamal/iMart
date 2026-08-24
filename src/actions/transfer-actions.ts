"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { CreateTransferSchema, type CreateTransferInput } from "@/schema/transfer.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type { ITransferStockRow, TSerializedTransfer } from "@/types/transfer.types";
import { applyStockMovement } from "@/actions/stock-actions";

function generateTransferNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PER-${ts}-${rand}`;
}

export async function getTransfers(): Promise<TSerializedTransfer[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const transfers = await prisma.transfer.findMany({
    where: { organizationId: session.organizationId },
    include: {
      fromPoint: { select: { id: true, name: true } },
      toPoint: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, code: true } },
          fromCell: { select: { id: true, name: true } },
          toCell: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return transfers.map((transfer) => ({
    ...transfer,
    totalAmount: Number(transfer.totalAmount),
    items: transfer.items.map((item) => ({
      ...item,
      qty: Number(item.qty),
      unitCost: Number(item.unitCost),
    })),
  }));
}

export async function getCellStockForTransfer(
  warehouseCellId: string,
  pointId: string
): Promise<ITransferStockRow[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const cell = await prisma.warehouseCell.findFirst({
    where: {
      id: warehouseCellId,
      warehouse: { organizationId: session.organizationId, pointId },
    },
    select: { id: true, name: true },
  });
  if (!cell) return [];

  const balances = await prisma.stockBalance.findMany({
    where: { warehouseCellId, qty: { gt: 0 } },
    include: { product: { select: { id: true, name: true, code: true } } },
    orderBy: { product: { name: "asc" } },
  });

  const prices = await prisma.itemPrice.findMany({ where: { warehouseCellId } });
  const priceMap = new Map(prices.map((p) => [p.productId, Number(p.price)]));

  return balances.map((balance) => ({
    cellId: cell.id,
    cellName: cell.name,
    productId: balance.productId,
    productName: balance.product.name,
    productCode: balance.product.code,
    qty: Number(balance.qty),
    price: priceMap.get(balance.productId) ?? (Number(balance.qty) > 0 ? Number(balance.amount) / Number(balance.qty) : 0),
  }));
}

export async function createTransfer(
  input: CreateTransferInput
): Promise<ActionResult<{ id: string; transferNumber: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "transfers:create");
    if (denied) return denied;

    const parsed = CreateTransferSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const { fromPointId, toPointId, note, items } = parsed.data;
    const pointIds = [fromPointId, toPointId];
    const points = await prisma.point.findMany({
      where: { id: { in: pointIds }, organizationId: session.organizationId },
      select: { id: true },
    });
    if (points.length !== new Set(pointIds).size) {
      return { success: false, error: "One or more points not found" };
    }

    const cellIds = [...new Set(items.flatMap((item) => [item.fromCellId, item.toCellId]))];
    const cells = await prisma.warehouseCell.findMany({
      where: {
        id: { in: cellIds },
        warehouse: { organizationId: session.organizationId },
      },
      select: { id: true, warehouse: { select: { pointId: true } } },
    });
    if (cells.length !== cellIds.length) return { success: false, error: "One or more warehouse cells not found" };

    const cellPoint = new Map(cells.map((cell) => [cell.id, cell.warehouse.pointId]));
    for (const item of items) {
      if (cellPoint.get(item.fromCellId) !== fromPointId || cellPoint.get(item.toCellId) !== toPointId) {
        return { success: false, error: "Warehouse cells do not belong to selected points" };
      }
      if (item.fromCellId === item.toCellId) {
        return { success: false, error: "Source and destination cells must be different" };
      }
    }

    const transferNumber = generateTransferNumber();
    const totalAmount = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

    const created = await prisma.$transaction(async (tx: TxClient) => {
      // Re-check current stock and current average price inside the transaction.
      for (const item of items) {
        const balance = await tx.stockBalance.findUnique({
          where: { warehouseCellId_productId: { warehouseCellId: item.fromCellId, productId: item.productId } },
        });
        const currentQty = balance ? Number(balance.qty) : 0;
        if (item.qty > currentQty) {
          throw new Error(`Not enough stock for product. Current stock: ${currentQty}`);
        }
      }

      const doc = await tx.transfer.create({
        data: {
          transferNumber,
          organizationId: session.organizationId,
          fromPointId,
          toPointId,
          note: note?.trim() || null,
          totalAmount,
          createdBy: session.userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              fromCellId: item.fromCellId,
              toCellId: item.toCellId,
              qty: item.qty,
              unitCost: item.unitCost,
            })),
          },
        },
      });

      for (const item of items) {
        await tx.inventoryRegister.create({
          data: {
            organizationId: session.organizationId,
            productId: item.productId,
            warehouseCellId: item.fromCellId,
            docType: "TRANSFER",
            docId: doc.id,
            direction: "OUT",
            qty: item.qty,
            unitCost: item.unitCost,
          },
        });
        await tx.inventoryRegister.create({
          data: {
            organizationId: session.organizationId,
            productId: item.productId,
            warehouseCellId: item.toCellId,
            docType: "TRANSFER",
            docId: doc.id,
            direction: "IN",
            qty: item.qty,
            unitCost: item.unitCost,
          },
        });

        const sourceBalance = await tx.stockBalance.findUnique({
          where: { warehouseCellId_productId: { warehouseCellId: item.fromCellId, productId: item.productId } },
        });
        const sourceQty = sourceBalance ? Number(sourceBalance.qty) : 0;
        const sourceAverage = sourceQty > 0 ? Number(sourceBalance!.amount) / sourceQty : item.unitCost;

        // Source stock leaves at its current average cost. The editable transfer
        // price is used for the destination, so changing it affects the
        // destination's weighted average without rewriting the source average.
        await tx.inventoryRegister.updateMany({
          where: { docType: "TRANSFER", docId: doc.id, warehouseCellId: item.fromCellId, productId: item.productId, direction: "OUT" },
          data: { unitCost: sourceAverage },
        });
        await applyStockMovement(tx, {
          warehouseCellId: item.fromCellId,
          productId: item.productId,
          direction: "OUT",
          qty: item.qty,
          unitCost: sourceAverage,
        });
        await applyStockMovement(tx, {
          warehouseCellId: item.toCellId,
          productId: item.productId,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        });
      }

      return doc;
    });

    revalidatePath("/transfers");
    revalidatePath("/warehouses");
    revalidatePath("/products");

    return { success: true, data: { id: created.id, transferNumber: created.transferNumber } };
  } catch (err) {
    console.error("[createTransfer]", err);
    return { success: false, error: err instanceof Error && err.message.startsWith("Not enough stock") ? err.message : "Failed to create transfer" };
  }
}

export async function deleteTransfer(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "transfers:delete");
    if (denied) return denied;

    const transfer = await prisma.transfer.findFirst({
      where: { id, organizationId: session.organizationId },
      include: { items: true },
    });
    if (!transfer) return { success: false, error: "Transfer not found" };

    await prisma.$transaction(async (tx: TxClient) => {
      const affected = new Map<string, { warehouseCellId: string; productId: string }>();
      for (const item of transfer.items) {
        affected.set(`${item.fromCellId}:${item.productId}`, { warehouseCellId: item.fromCellId, productId: item.productId });
        affected.set(`${item.toCellId}:${item.productId}`, { warehouseCellId: item.toCellId, productId: item.productId });
      }

      await tx.inventoryRegister.deleteMany({ where: { docType: "TRANSFER", docId: id } });
      await tx.transfer.delete({ where: { id } });

      // Rebuild the current balance/average for every affected cell from the
      // remaining ledger. This keeps deletion correct even if later movements
      // changed the average price after this document was created.
      for (const { warehouseCellId, productId } of affected.values()) {
        const registers = await tx.inventoryRegister.findMany({
          where: { warehouseCellId, productId },
          select: { direction: true, qty: true, unitCost: true },
        });
        let qty = 0;
        let amount = 0;
        for (const register of registers) {
          const q = Number(register.qty);
          const value = q * Number(register.unitCost ?? 0);
          if (register.direction === "IN") {
            qty += q;
            amount += value;
          } else {
            qty -= q;
            amount -= value;
          }
        }

        const safeQty = Math.max(0, qty);
        const safeAmount = safeQty > 0 ? amount : 0;
        const price = safeQty > 0 ? safeAmount / safeQty : 0;
        await tx.stockBalance.upsert({
          where: { warehouseCellId_productId: { warehouseCellId, productId } },
          create: { warehouseCellId, productId, qty: safeQty, amount: safeAmount },
          update: { qty: safeQty, amount: safeAmount },
        });
        await tx.itemPrice.upsert({
          where: { warehouseCellId_productId: { warehouseCellId, productId } },
          create: { warehouseCellId, productId, price },
          update: { price },
        });
      }
    });

    revalidatePath("/transfers");
    revalidatePath("/warehouses");
    revalidatePath("/products");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteTransfer]", err);
    return { success: false, error: "Failed to delete transfer" };
  }
}
