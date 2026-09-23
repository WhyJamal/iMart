"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

import type {
  ISalesReportFilters,
  ISalesReportRow,
  ISalesReport,
} from "@/types/sales-report.types";
import type { ActionResult } from "@/types/action-result.types";

interface Row {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  categoryName: string;
  qty: number;
  revenue: number;
  cost: number;
}

/**
 * Sotishlar hisoboti — har bir mahsulot bo'yicha: sotilgan miqdor,
 * o'rtacha narx, tushum, tannarx va foyda. 1C'dagi "Продажи" /
 * "Валовая прибыль" hisobotlariga o'xshash.
 *
 * Manba:
 *   Tushum/miqdor -> SaleItem (davr = Sale.createdAt), minus
 *                     SaleReturnItem (davr = SaleReturn.createdAt).
 *   Tannarx        -> InventoryRegister: docType=SALE (OUT) minus
 *                     docType=SALE_RETURN (IN) — sotuv payti
 *                     yozib qo'yilgan haqiqiy tannarx (pricingMode'dan
 *                     qat'i nazar to'g'ri).
 *
 * pointId berilsa — faqat o'sha nuqtaga tegishli sotuvlar; categoryId
 * berilsa — faqat o'sha kategoriyadagi mahsulotlar.
 */
export async function getSalesReport(
  filters: ISalesReportFilters = {}
): Promise<ActionResult<ISalesReport>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "reports:read");
    if (denied) return denied;

    const { pointId, categoryId } = filters;
    const organizationId = session.organizationId;

    const start = filters.dateFrom
      ? new Date(`${filters.dateFrom}T00:00:00`)
      : null;
    const end = filters.dateTo
      ? new Date(`${filters.dateTo}T23:59:59.999`)
      : null;
    if (
      (start && Number.isNaN(start.getTime())) ||
      (end && Number.isNaN(end.getTime())) ||
      (start && end && start > end)
    ) {
      return { success: false, error: "Sana oralig'i noto'g'ri" };
    }
    const dateRange =
      start || end
        ? { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) }
        : undefined;

    const [saleItems, returnItems, costMovements] = await Promise.all([
      prisma.saleItem.findMany({
        where: {
          sale: {
            organizationId,
            ...(dateRange ? { createdAt: dateRange } : {}),
            ...(pointId ? { pointId } : {}),
          },
          ...(categoryId ? { product: { categoryId } } : {}),
        },
        select: {
          productId: true,
          qty: true,
          unitPrice: true,
          product: {
            select: {
              name: true,
              code: true,
              unit: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.saleReturnItem.findMany({
        where: {
          return: {
            organizationId,
            ...(dateRange ? { createdAt: dateRange } : {}),
            ...(pointId ? { sale: { pointId } } : {}),
          },
          ...(categoryId ? { product: { categoryId } } : {}),
        },
        select: {
          productId: true,
          qty: true,
          unitPrice: true,
          product: {
            select: {
              name: true,
              code: true,
              unit: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.inventoryRegister.findMany({
        where: {
          organizationId,
          ...(dateRange ? { createdAt: dateRange } : {}),
          docType: { in: ["SALE", "SALE_RETURN"] },
          ...(pointId
            ? { warehouseCell: { warehouse: { pointId } } }
            : {}),
          ...(categoryId ? { product: { categoryId } } : {}),
        },
        select: { productId: true, docType: true, direction: true, qty: true, unitCost: true },
      }),
    ]);

    const rows = new Map<string, Row>();

    const ensure = (
      productId: string,
      product: { name: string; code: string; unit: string; category: { name: string } | null }
    ) => {
      let row = rows.get(productId);
      if (!row) {
        row = {
          productId,
          productName: product.name,
          productCode: product.code,
          unit: product.unit,
          categoryName: product.category?.name ?? "—",
          qty: 0,
          revenue: 0,
          cost: 0,
        };
        rows.set(productId, row);
      }
      return row;
    };

    for (const item of saleItems as (typeof saleItems)[number][]) {
      const row = ensure(item.productId, item.product);
      row.qty += Number(item.qty);
      row.revenue += Number(item.qty) * Number(item.unitPrice);
    }

    for (const item of returnItems as (typeof returnItems)[number][]) {
      const row = ensure(item.productId, item.product);
      row.qty -= Number(item.qty);
      row.revenue -= Number(item.qty) * Number(item.unitPrice);
    }

    // Tannarx uchun mahsulot nomi kerak bo'lsa-yu, hali xaritada
    // bo'lmasa (masalan davr ichida faqat OLDIN sotilgan tovarning
    // WriteOff/return harakati bo'lsa) — shu yozuvlar o'tkazib
    // yuboriladi, chunki bunday holatda mahsulot ma'lumoti bu
    // so'rovda yo'q (InventoryRegister'da faqat id bor). Amalda bu
    // holat sale/return harakati bilan birga keladi, shuning uchun
    // deyarli har doim xaritada allaqachon bor bo'ladi.
    for (const mv of costMovements as (typeof costMovements)[number][]) {
      const row = rows.get(mv.productId);
      if (!row) continue;
      const amount = Number(mv.qty) * Number(mv.unitCost ?? 0);
      if (mv.docType === "SALE" && mv.direction === "OUT") {
        row.cost += amount;
      } else if (mv.docType === "SALE_RETURN" && mv.direction === "IN") {
        row.cost -= amount;
      }
    }

    const resultRows: ISalesReportRow[] = [...rows.values()]
      .filter((r) => r.qty !== 0 || r.revenue !== 0)
      .map((r) => {
        const profit = r.revenue - r.cost;
        return {
          productId: r.productId,
          productName: r.productName,
          productCode: r.productCode,
          unit: r.unit,
          categoryName: r.categoryName,
          qty: r.qty,
          avgPrice: r.qty !== 0 ? r.revenue / r.qty : 0,
          revenue: r.revenue,
          cost: r.cost,
          profit,
          marginPct: r.revenue !== 0 ? (profit / r.revenue) * 100 : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const totals = resultRows.reduce(
      (acc, r) => ({
        qty: acc.qty + r.qty,
        revenue: acc.revenue + r.revenue,
        cost: acc.cost + r.cost,
        profit: acc.profit + r.profit,
      }),
      { qty: 0, revenue: 0, cost: 0, profit: 0 }
    );

    return {
      success: true,
      data: {
        rows: resultRows,
        totals: {
          ...totals,
          marginPct: totals.revenue !== 0 ? (totals.profit / totals.revenue) * 100 : 0,
        },
      },
    };
  } catch (err) {
    console.error("[getSalesReport]", err);
    return { success: false, error: "Hisobotni yuklab bo'lmadi" };
  }
}
