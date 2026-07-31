"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
  type CreateWarehouseInput,
  type UpdateWarehouseInput,
} from "@/schema/warehouse.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type {
  IWarehouse,
  IWarehouseOption,
  IWarehouseStockRow,
} from "@/types/warehouse.types";

export async function getWarehouses(): Promise<IWarehouse[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: session.organizationId },
    include: {
      point: { select: { id: true, name: true } },
      cells: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return warehouses.map((w: (typeof warehouses)[number]) => ({
    id: w.id,
    name: w.name,
    pointId: w.point.id,
    pointName: w.point.name,
    cells: w.cells,
    createdAt: w.createdAt,
  }));
}

export async function getWarehouseOptions(
  pointId?: string
): Promise<IWarehouseOption[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const warehouses = await prisma.warehouse.findMany({
    where: {
      organizationId: session.organizationId,
      ...(pointId ? { pointId } : {}),
    },
    select: { id: true, name: true, pointId: true },
    orderBy: { name: "asc" },
  });

  return warehouses;
}

/**
 * Sklad ustiga bosilganda pastda chiqadigan "shu skladdagi tovarlar"
 * jadvali — har bir yacheyka + mahsulot bo'yicha joriy qoldiq,
 * InventoryRegister'dan hisoblanadi (IN musbat, OUT manfiy).
 */
export async function getWarehouseStock(
  warehouseId: string
): Promise<IWarehouseStockRow[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, organizationId: session.organizationId },
    include: { cells: true },
  });
  if (!warehouse) return [];

  const cellIds = warehouse.cells.map((c: (typeof warehouse.cells)[number]) => c.id);
  if (cellIds.length === 0) return [];

  const registers = await prisma.inventoryRegister.findMany({
    where: { warehouseCellId: { in: cellIds } },
    include: { product: { select: { id: true, name: true, code: true } } },
  });

  const cellNameMap = new Map<string, string>(
    warehouse.cells.map((c: (typeof warehouse.cells)[number]) => [c.id, c.name])
  );

  const stockMap = new Map<string, IWarehouseStockRow>();
  for (const r of registers) {
    const key = `${r.warehouseCellId}:${r.productId}`;
    const signedQty = r.direction === "IN" ? Number(r.qty) : -Number(r.qty);
    const existing = stockMap.get(key);
    if (existing) {
      existing.qty += signedQty;
    } else {
      stockMap.set(key, {
        cellId: r.warehouseCellId as string,
        cellName: cellNameMap.get(r.warehouseCellId as string) ?? "",
        productId: r.productId,
        productName: r.product.name,
        productCode: r.product.code,
        qty: signedQty,
      });
    }
  }

  return Array.from(stockMap.values())
    .filter((row) => row.qty !== 0)
    .sort((a, b) => a.cellName.localeCompare(b.cellName));
}

export async function createWarehouse(
  input: CreateWarehouseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "warehouses:manage");
    if (denied) return denied;

    const parsed = CreateWarehouseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { name, pointId, cells } = parsed.data;

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: session.organizationId,
        pointId,
        name,
        cells: { create: cells.map((c) => ({ name: c.name })) },
      },
    });

    revalidatePath("/warehouses");
    return { success: true, data: { id: warehouse.id } };
  } catch (err) {
    console.error("[createWarehouse]", err);
    return { success: false, error: "Skladni yaratib bo'lmadi" };
  }
}

export async function updateWarehouse(
  input: UpdateWarehouseInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "warehouses:manage");
    if (denied) return denied;

    const parsed = UpdateWarehouseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { id, name, pointId, cells } = parsed.data;

    const existing = await prisma.warehouse.findFirst({
      where: { id, organizationId: session.organizationId },
      include: { cells: true },
    });
    if (!existing) return { success: false, error: "Sklad topilmadi" };

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    const existingIds = new Set<string>(
      existing.cells.map((c: (typeof existing.cells)[number]) => c.id)
    );
    const incomingIds = new Set(cells.filter((c) => c.id).map((c) => c.id as string));

    const toDelete = [...existingIds].filter((cid) => !incomingIds.has(cid));
    const toUpdate = cells.filter((c) => c.id && existingIds.has(c.id));
    const toCreate = cells.filter((c) => !c.id);

    await prisma.$transaction(async (tx: TxClient) => {
      await tx.warehouse.update({ where: { id }, data: { name, pointId } });

      if (toDelete.length > 0) {
        await tx.warehouseCell.deleteMany({ where: { id: { in: toDelete } } });
      }
      for (const c of toUpdate) {
        await tx.warehouseCell.update({
          where: { id: c.id as string },
          data: { name: c.name },
        });
      }
      if (toCreate.length > 0) {
        await tx.warehouseCell.createMany({
          data: toCreate.map((c) => ({ warehouseId: id, name: c.name })),
        });
      }
    });

    revalidatePath("/warehouses");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateWarehouse]", err);
    return { success: false, error: "Skladni yangilab bo'lmadi" };
  }
}

export async function deleteWarehouse(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "warehouses:manage");
    if (denied) return denied;

    const existing = await prisma.warehouse.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Sklad topilmadi" };

    await prisma.warehouse.delete({ where: { id } });

    revalidatePath("/warehouses");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteWarehouse]", err);
    return { success: false, error: "Skladni o'chirib bo'lmadi" };
  }
}
