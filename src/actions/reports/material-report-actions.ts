"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import type {
  IMaterialReportFilters,
  IMaterialReportRow,
} from "@/types/material-report.types";

/**
 * Material otchyot (ombor bo'yicha moddiy hisobot).
 * StockBalance — joriy qoldiq + summa jadvalidan o'qiydi (harakatlar
 * jurnalini qayta yig'ib hisoblash shart emas). Har qator — bitta
 * (mahsulot, sklad yacheykasi) juftligi; yacheyka qaysi sklad va
 * nuqtaga tegishli ekani ham qo'shib chiqariladi.
 */
export async function getMaterialReport(
  filters: IMaterialReportFilters = {}
): Promise<IMaterialReportRow[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const { pointId, warehouseId, categoryId, productId } = filters;

  const balances = await prisma.stockBalance.findMany({
    where: {
      product: {
        organizationId: session.organizationId,
        ...(productId ? { id: productId } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      warehouseCell: {
        ...(warehouseId ? { warehouseId } : {}),
        warehouse: {
          organizationId: session.organizationId,
          ...(pointId ? { pointId } : {}),
        },
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          code: true,
          unit: true,
          category: { select: { name: true } },
        },
      },
      warehouseCell: {
        select: {
          id: true,
          name: true,
          warehouse: {
            select: {
              id: true,
              name: true,
              point: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: [
      { product: { name: "asc" } },
      { warehouseCell: { name: "asc" } },
    ],
  });

  return balances
    .filter((b: (typeof balances)[number]) => Number(b.qty) !== 0)
    .map((b: (typeof balances)[number]) => {
      const qty = Number(b.qty);
      const amount = Number(b.amount);

      return {
        productId: b.product.id,
        productName: b.product.name,
        productCode: b.product.code,
        unit: b.product.unit,
        categoryName: b.product.category?.name ?? "—",

        pointId: b.warehouseCell.warehouse.point.id,
        pointName: b.warehouseCell.warehouse.point.name,

        warehouseId: b.warehouseCell.warehouse.id,
        warehouseName: b.warehouseCell.warehouse.name,

        cellId: b.warehouseCell.id,
        cellName: b.warehouseCell.name,

        qty,
        price: qty !== 0 ? amount / qty : 0,
        amount,
      };
    });
}
