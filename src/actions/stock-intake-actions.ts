"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { applyStockMovement } from "@/actions/stock-actions";
import { StockIntakeSchema, type StockIntakeInput } from "@/schema/stock-intake.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type { IStockIntake, IStockIntakeListItem } from "@/types/stock-intake.types";

function generateIntakeNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KIR-${ts}-${rand}`;
}

// ─── O'qish ─────────────────────────────────────────────────────────────────

export async function getStockIntakes(): Promise<IStockIntakeListItem[]> {
  const session = await getServerSession();
  if (!session) return [];

  const rows = await prisma.stockIntake.findMany({
    where: { organizationId: session.organizationId },
    include: {
      point: { select: { name: true } },
      items: { select: { qty: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r: (typeof rows)[number]) => ({
    id: r.id,
    number: r.number,
    pointName: r.point?.name ?? null,
    itemsCount: r.items.length,
    totalQty: r.items.reduce(
      (sum: number, i: (typeof r.items)[number]) => sum + Number(i.qty),
      0
    ),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getStockIntakeById(id: string): Promise<IStockIntake | null> {
  const session = await getServerSession();
  if (!session) return null;

  const row = await prisma.stockIntake.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      point: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, code: true, unit: true } },
          warehouseCell: {
            select: { name: true, warehouse: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    number: row.number,
    pointId: row.pointId,
    pointName: row.point?.name ?? null,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((i: (typeof row.items)[number]) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      productCode: i.product.code,
      unit: i.product.unit,
      warehouseCellId: i.warehouseCellId,
      warehouseCellName: i.warehouseCell.name,
      warehouseName: i.warehouseCell.warehouse.name,
      qty: Number(i.qty),
      unitCost: i.unitCost !== null ? Number(i.unitCost) : null,
    })),
  };
}

// ─── Yordamchi: kirish ma'lumotlarini tekshirish + narxni to'ldirish ───────

async function validateAndFillItems(
  organizationId: string,
  pointId: string,
  items: StockIntakeInput["items"]
): Promise<
  | { error: string }
  | {
    items: Array<
      StockIntakeInput["items"][number] & {
        unitCost: number;
      }
    >;
  }
> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, organizationId },
    select: { id: true, price: true },
  });
  if (products.length !== productIds.length) {
    return { error: "Mahsulotlardan biri topilmadi" } as const;
  }
  const priceMap = new Map<string, number>(
    products.map((p: (typeof products)[number]) => [
      p.id,
      Number(p.price),
    ])
  );

  const cellIds = [...new Set(items.map((i) => i.warehouseCellId))];
  const cells = await prisma.warehouseCell.findMany({
    where: { id: { in: cellIds }, warehouse: { pointId } },
    select: { id: true },
  });
  if (cells.length !== cellIds.length) {
    return {
      error: "Yacheykalardan biri tanlangan nuqtaga tegishli emas",
    } as const;
  }

  const filled = items.map((item) => ({
    ...item,
    unitCost:
      item.unitCost !== null && item.unitCost !== undefined
        ? Number(item.unitCost)
        : Number(priceMap.get(item.productId) ?? 0),
  }));

  return { items: filled } as const;
}

// ─── Yaratish ───────────────────────────────────────────────────────────────

export async function createStockIntake(
  input: StockIntakeInput
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "stock-intake:create");
    if (denied) return denied;

    const parsed = StockIntakeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { pointId, note, items } = parsed.data;

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    const filled = await validateAndFillItems(session.organizationId, pointId, items);
    if ("error" in filled) return { success: false, error: filled.error };

    const number = generateIntakeNumber();

    const doc = await prisma.$transaction(async (tx: TxClient) => {
      const created = await tx.stockIntake.create({
        data: {
          number,
          organizationId: session.organizationId,
          pointId,
          note: note?.trim() || null,
          createdBy: session.userId,
          items: {
            create: filled.items.map((item) => ({
              productId: item.productId,
              warehouseCellId: item.warehouseCellId,
              qty: item.qty,
              unitCost: item.unitCost,
            })),
          },
        },
      });

      await tx.inventoryRegister.createMany({
        data: filled.items.map((item) => ({
          organizationId: session.organizationId,
          productId: item.productId,
          warehouseCellId: item.warehouseCellId,
          docType: "STOCK_INTAKE",
          docId: created.id,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        })),
      });

      for (const item of filled.items) {
        await applyStockMovement(tx, {
          warehouseCellId: item.warehouseCellId,
          productId: item.productId,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        });
      }

      return created;
    });

    revalidatePath("/stock-intake");
    revalidatePath("/products");

    return { success: true, data: { id: doc.id, number: doc.number } };
  } catch (err) {
    console.error("[createStockIntake]", err);
    return { success: false, error: "Hujjatni saqlashda xatolik yuz berdi." };
  }
}

// ─── Yangilash (Excel orqali qatorlarni almashtirish ham shu orqali) ───────
//
// Har doim TO'LIQ ALMASHTIRISH sifatida ishlaydi: eski qatorlarning
// ombordagi ta'sirini avval bekor qiladi (OUT bilan), keyin yangi
// qatorlarni qo'shadi. Shu tufayli "qo'lda tahrirlash" ham, "Excel'dan
// qayta yuklash" ham (izohlarda aytganingizdek — qatorlarni tozalab,
// yangisini yozadi) bir xil, xavfsiz yo'l bilan ishlaydi.
export async function updateStockIntake(
  id: string,
  input: StockIntakeInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "stock-intake:create");
    if (denied) return denied;

    const parsed = StockIntakeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { pointId, note, items } = parsed.data;

    const existing = await prisma.stockIntake.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Hujjat topilmadi" };

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    const filled = await validateAndFillItems(session.organizationId, pointId, items);
    if ("error" in filled) return { success: false, error: filled.error };

    await prisma.$transaction(async (tx: TxClient) => {
      const oldRegisters = await tx.inventoryRegister.findMany({
        where: { docType: "STOCK_INTAKE", docId: id },
      });
      for (const reg of oldRegisters) {
        if (!reg.warehouseCellId) continue;
        await applyStockMovement(tx, {
          warehouseCellId: reg.warehouseCellId,
          productId: reg.productId,
          direction: "OUT", // eski IN'ni bekor qilish
          qty: Number(reg.qty),
          unitCost: Number(reg.unitCost ?? 0),
        });
      }

      await tx.stockIntakeItem.deleteMany({ where: { intakeId: id } });
      await tx.inventoryRegister.deleteMany({
        where: { docType: "STOCK_INTAKE", docId: id },
      });

      await tx.stockIntake.update({
        where: { id },
        data: {
          pointId,
          note: note?.trim() || null,
          items: {
            create: filled.items.map((item) => ({
              productId: item.productId,
              warehouseCellId: item.warehouseCellId,
              qty: item.qty,
              unitCost: item.unitCost,
            })),
          },
        },
      });

      await tx.inventoryRegister.createMany({
        data: filled.items.map((item) => ({
          organizationId: session.organizationId,
          productId: item.productId,
          warehouseCellId: item.warehouseCellId,
          docType: "STOCK_INTAKE",
          docId: id,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        })),
      });

      for (const item of filled.items) {
        await applyStockMovement(tx, {
          warehouseCellId: item.warehouseCellId,
          productId: item.productId,
          direction: "IN",
          qty: item.qty,
          unitCost: item.unitCost,
        });
      }
    });

    revalidatePath("/stock-intake");
    revalidatePath("/products");

    return { success: true, data: { id } };
  } catch (err) {
    console.error("[updateStockIntake]", err);
    return { success: false, error: "Hujjatni yangilashda xatolik yuz berdi." };
  }
}

// ─── O'chirish ──────────────────────────────────────────────────────────────

export async function deleteStockIntake(id: string): Promise<ActionResult> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "stock-intake:delete");
    if (denied) return denied;

    const existing = await prisma.stockIntake.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Hujjat topilmadi" };

    await prisma.$transaction(async (tx: TxClient) => {
      const oldRegisters = await tx.inventoryRegister.findMany({
        where: { docType: "STOCK_INTAKE", docId: id },
      });
      for (const reg of oldRegisters) {
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
        where: { docType: "STOCK_INTAKE", docId: id },
      });
      await tx.stockIntake.delete({ where: { id } });
    });

    revalidatePath("/stock-intake");
    revalidatePath("/products");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteStockIntake]", err);
    return { success: false, error: "Hujjatni o'chirishda xatolik yuz berdi." };
  }
}

// ─── Excel shablon uchun: nomenklatura ro'yxati (kod bilan) ────────────────

export async function getProductCodeList(): Promise<
  { code: string; name: string; unit: string }[]
> {
  const session = await getServerSession();
  if (!session) return [];

  const products = await prisma.product.findMany({
    where: { organizationId: session.organizationId },
    select: { code: true, name: true, unit: true },
    orderBy: { name: "asc" },
  });

  return products;
}
