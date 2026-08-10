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
  ICellStockOption,
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

// ─── Point-level stock (Purchases/POS integratsiyasi uchun) ───────────────────

/**
 * Point'ga tegishli barcha sklad yacheykalarining id'lari.
 */
async function getCellIdsForPoint(pointId: string): Promise<string[]> {
  const cells = await prisma.warehouseCell.findMany({
    where: { warehouse: { pointId } },
    select: { id: true },
  });
  return cells.map((c: (typeof cells)[number]) => c.id);
}

/**
 * Berilgan Point'dagi (uning skladlari/yacheykalari bo'yicha jamlangan)
 * har bir mahsulot uchun joriy qoldiq. POS'da sotish uchun ishlatiladi.
 */
export async function getPointStockMap(
  pointId: string
): Promise<Map<string, number>> {
  const cellIds = await getCellIdsForPoint(pointId);
  const map = new Map<string, number>();
  if (cellIds.length === 0) return map;

  const rows = await prisma.inventoryRegister.groupBy({
    by: ["productId", "direction"],
    where: { warehouseCellId: { in: cellIds } },
    _sum: { qty: true },
  });

  for (const row of rows) {
    const val = Number(row._sum.qty ?? 0);
    const prev = map.get(row.productId) ?? 0;
    map.set(row.productId, row.direction === "IN" ? prev + val : prev - val);
  }
  return map;
}

/**
 * Sotuvda bitta mahsulotni Point ostidagi yacheykalardan "greedy"
 * usulda yechib olish uchun — har bir yacheykadagi joriy qoldiqni
 * eng ko'pidan kamiga qarab qaytaradi. sale-actions.ts shu ro'yxatdan
 * kerakli miqdorni yig'ib, har biriga alohida InventoryRegister OUT
 * yozuvi yozadi.
 */
export async function getSellableCellsForProduct(
  pointId: string,
  productId: string,
  tx?: TxClient
): Promise<{ warehouseCellId: string; available: number }[]> {
  const client = tx ?? prisma;
  const cellIds = await getCellIdsForPoint(pointId);
  if (cellIds.length === 0) return [];

  const rows = await client.inventoryRegister.groupBy({
    by: ["warehouseCellId", "direction"],
    where: { warehouseCellId: { in: cellIds }, productId },
    _sum: { qty: true },
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.warehouseCellId) continue;
    const val = Number(row._sum.qty ?? 0);
    const prev = map.get(row.warehouseCellId) ?? 0;
    map.set(
      row.warehouseCellId,
      row.direction === "IN" ? prev + val : prev - val
    );
  }

  return Array.from(map.entries())
    .map(([warehouseCellId, available]) => ({ warehouseCellId, available }))
    .filter((c) => c.available > 0)
    .sort((a, b) => b.available - a.available);
}

/**
 * getPointStockMap() Map qaytaradi — Server Action orqali client'ga
 * to'g'ridan-to'g'ri yuborish uchun oddiy object'ga aylantiradi.
 * pos-terminal.tsx Point o'zgarganda shuni chaqiradi.
 */
export async function getPointStockRecord(
  pointId: string
): Promise<Record<string, number>> {
  const map = await getPointStockMap(pointId);
  return Object.fromEntries(map);
}

/**
 * Point ostidagi HAR BIR mahsulot uchun qaysi yacheykada qancha bor
 * ekanini qaytaradi (eng ko'pidan kamiga saralangan). POS'da savatga
 * mahsulot qo'shilganda avtomatik eng ko'p qoldiqli yacheyka
 * tanlanadi, kassir xohlasa boshqasiga o'zgartiradi.
 */
export async function getPointCellStock(
  pointId: string
): Promise<Record<string, ICellStockOption[]>> {
  const cells = await prisma.warehouseCell.findMany({
    where: { warehouse: { pointId } },
    include: { warehouse: { select: { name: true } } },
  });
  if (cells.length === 0) return {};

  const cellIds = cells.map((c: (typeof cells)[number]) => c.id);
  const cellInfo = new Map<string, { cellName: string; warehouseName: string }>(
    cells.map((c: (typeof cells)[number]) => [
      c.id,
      { cellName: c.name, warehouseName: c.warehouse.name },
    ])
  );

  const rows = await prisma.inventoryRegister.groupBy({
    by: ["productId", "warehouseCellId", "direction"],
    where: { warehouseCellId: { in: cellIds } },
    _sum: { qty: true },
  });

  // ItemPrice — shu yacheykalardagi joriy narxlar
  const priceRows = await prisma.itemPrice.findMany({
    where: { warehouseCellId: { in: cellIds } },
  });
  const priceMap = new Map<string, number>(); // `${cellId}:${productId}` -> price
  for (const p of priceRows) {
    priceMap.set(`${p.warehouseCellId}:${p.productId}`, Number(p.price));
  }

  // productId -> cellId -> qty
  const byProduct = new Map<string, Map<string, number>>();
  for (const row of rows) {
    if (!row.warehouseCellId) continue;
    const val = Number(row._sum.qty ?? 0);
    if (!byProduct.has(row.productId)) byProduct.set(row.productId, new Map());
    const cellMap = byProduct.get(row.productId)!;
    const prev = cellMap.get(row.warehouseCellId) ?? 0;
    cellMap.set(
      row.warehouseCellId,
      row.direction === "IN" ? prev + val : prev - val
    );
  }

  const result: Record<string, ICellStockOption[]> = {};
  for (const [productId, cellMap] of byProduct.entries()) {
    const options = Array.from(cellMap.entries())
      .map(([warehouseCellId, available]) => {
        const info = cellInfo.get(warehouseCellId);
        return {
          warehouseCellId,
          cellName: info?.cellName ?? "",
          warehouseName: info?.warehouseName ?? "",
          available,
          price: priceMap.get(`${warehouseCellId}:${productId}`) ?? 0,
        };
      })
      .filter((c) => c.available > 0)
      .sort((a, b) => b.available - a.available);

    if (options.length > 0) result[productId] = options;
  }

  return result;
}
