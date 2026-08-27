"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { CreatePromotionSchema, type CreatePromotionInput } from "@/schema/promotion.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { IPromotion, IPromotionDiscount } from "@/types/promotion.types";

export async function getPromotions(): Promise<IPromotion[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const rows = await prisma.promotion.findMany({
    where: { organizationId: session.organizationId },
    include: {
      point: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true } },
      warehouseCell: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { id: true, name: true, code: true } } },
        orderBy: { product: { name: "asc" } },
      },
    },
    orderBy: { endsAt: "asc" },
  });

  return rows.map((r: (typeof rows)[number]) => ({
    id: r.id,
    name: r.name,
    pointId: r.pointId,
    pointName: r.point.name,
    warehouseId: r.warehouseId,
    warehouseName: r.warehouse.name,
    warehouseCellId: r.warehouseCellId,
    warehouseCellName: r.warehouseCell.name,
    discountPercent: Number(r.discountPercent),
    endsAt: r.endsAt,
    comment: r.comment,
    createdAt: r.createdAt,
    items: r.items.map((i: (typeof r.items)[number]) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      productCode: i.product.code,
    })),
  }));
}

export async function createPromotion(
  input: CreatePromotionInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };
    const denied = checkPermission(session.role, "promotions:manage");
    if (denied) return denied;

    const parsed = CreatePromotionSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const data = parsed.data;
    const endsAt = new Date(data.endsAt);
    if (Number.isNaN(endsAt.getTime()) || endsAt <= new Date()) {
      return { success: false, error: "Дата окончания должна быть в будущем" };
    }

    const point = await prisma.point.findFirst({
      where: { id: data.pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Точка не найдена" };

    const warehouse = await prisma.warehouse.findFirst({
      where: { id: data.warehouseId, organizationId: session.organizationId, pointId: data.pointId },
      include: { cells: { select: { id: true, name: true } } },
    });
    if (!warehouse) return { success: false, error: "Склад не относится к выбранной точке" };

    const cell = await prisma.warehouseCell.findFirst({
      where: { id: data.warehouseCellId, warehouseId: warehouse.id },
      select: { id: true },
    });
    if (!cell) return { success: false, error: "Ячейка не относится к выбранному складу" };

    const requestedProductIds = [...new Set(data.productIds)];
    const products = await prisma.product.findMany({
      where: { id: { in: requestedProductIds }, organizationId: session.organizationId },
      select: { id: true },
    });
    if (products.length !== requestedProductIds.length) {
      return { success: false, error: "Один или несколько товаров не найдены" };
    }

    const stockRows = await prisma.inventoryRegister.groupBy({
      by: ["productId", "direction"],
      where: { warehouseCellId: cell.id, productId: { in: requestedProductIds } },
      _sum: { qty: true },
    });
    const stock = new Map<string, number>();
    for (const row of stockRows) {
      const qty = Number(row._sum.qty ?? 0);
      stock.set(row.productId, (stock.get(row.productId) ?? 0) + (row.direction === "IN" ? qty : -qty));
    }
    const unavailable = requestedProductIds.filter((productId) => (stock.get(productId) ?? 0) <= 0);
    if (unavailable.length) {
      return { success: false, error: "Акцию можно создать только для товаров, которые есть в выбранной ячейке" };
    }

    const promotion = await prisma.promotion.create({
      data: {
        organizationId: session.organizationId,
        pointId: data.pointId,
        warehouseId: data.warehouseId,
        warehouseCellId: data.warehouseCellId,
        name: data.name,
        discountPercent: data.discountPercent,
        endsAt,
        comment: data.comment?.trim() || null,
        items: { create: [...new Set(data.productIds)].map((productId) => ({ productId })) },
      },
    });

    revalidatePath("/promotions");
    revalidatePath("/pos");
    return { success: true, data: { id: promotion.id } };
  } catch (err) {
    console.error("[createPromotion]", err);
    return { success: false, error: "Акцию не удалось создать" };
  }
}

export async function deletePromotion(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };
    const denied = checkPermission(session.role, "promotions:manage");
    if (denied) return denied;

    const promotion = await prisma.promotion.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!promotion) return { success: false, error: "Акция не найдена" };

    await prisma.promotion.delete({ where: { id } });
    revalidatePath("/promotions");
    revalidatePath("/pos");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deletePromotion]", err);
    return { success: false, error: "Акцию не удалось удалить" };
  }
}

export async function getActivePromotionDiscounts(
  pointId: string
): Promise<IPromotionDiscount[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const now = new Date();
  const rows = await prisma.promotion.findMany({
    where: {
      organizationId: session.organizationId,
      pointId,
      endsAt: { gt: now },
    },
    include: { items: true },
  });

  const best = new Map<string, IPromotionDiscount>();
  for (const row of rows) {
    for (const item of row.items) {
      const key = `${row.warehouseCellId}:${item.productId}`;
      const current = best.get(key);
      if (!current || Number(row.discountPercent) > current.discountPercent) {
        best.set(key, {
          productId: item.productId,
          warehouseId: row.warehouseId,
          warehouseCellId: row.warehouseCellId,
          discountPercent: Number(row.discountPercent),
          promotionName: row.name,
          endsAt: row.endsAt,
        });
      }
    }
  }
  return [...best.values()];
}
