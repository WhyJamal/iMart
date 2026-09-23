"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import type { ActionResult } from "@/types/action-result.types";
import type { IProfitLossReport } from "@/types/profit-loss.types";

/**
 * getProfitLossReport — berilgan davr (va ixtiyoriy ravishda bitta
 * nuqta) uchun to'liq Foyda-Zarar (P&L) hisobotini chiqaradi. Barcha
 * raqamlar "accrual" asosida — ya'ni hujjat YOZILGAN sanaga qarab
 * (pul haqiqatda qachon kelgani/ketgani emas). Manba ma'lumotlar:
 *
 *   Tushum        -> Sale.totalAmount (davr ichida)
 *   Qaytarishlar  -> SaleReturn.totalAmount (davr ichida)
 *   Tannarx (COGS)-> InventoryRegister: docType=SALE (OUT) minus
 *                    docType=SALE_RETURN (IN) — har bir sotuv payti
 *                    applyStockMovement/getItemPrice orqali YOZIB
 *                    QO'YILGAN haqiqiy tannarx, shuning uchun
 *                    pricingMode (CATALOG/AVERAGE) sotuv narxiga
 *                    qanday ta'sir qilsa ham, TANNARX har doim to'g'ri
 *                    hisoblanadi.
 *   Yo'qotish     -> InventoryRegister: docType=ADJUSTMENT (OUT),
 *                    ya'ni WriteOff hujjatlari.
 *   Qo'lda xarajat-> CashFlow: docType=EXPENSE, direction=OUT.
 *   Oylik (payroll)-> PayrollAccrualLine.grossAmount, faqat
 *                    status=CONFIRMED bo'lgan, davrga to'g'ri keladigan
 *                    (year, month) accrual'lardan.
 *
 * pointId — berilsa, hisobot FAQAT o'sha nuqtaga tegishli
 * ma'lumotlar bilan chiqadi:
 *   - Sale/SaleReturn: to'g'ridan-to'g'ri (yoki bog'langan Sale
 *     orqali) pointId bo'yicha.
 *   - InventoryRegister: warehouseCellId -> Warehouse.pointId orqali
 *     (registerning o'zida pointId yo'q).
 *   - WriteOff / PayrollAccrual: to'g'ridan-to'g'ri pointId bo'yicha.
 *   - CashFlow (qo'lda xarajatlar): to'g'ridan-to'g'ri pointId bo'yicha.
 *     "Nuqtasiz (umumiy)" deb yozilgan xarajatlar (pointId = null)
 *     faqat pointId FILTRLANMAGAN (butun tashkilot) hisobotga kiradi —
 *     bitta nuqta tanlansa, ular o'sha nuqtaning hisobotiga kirmaydi.
 */
export async function getProfitLossReport(input: {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  pointId?: string;
}): Promise<ActionResult<IProfitLossReport>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "reports:read");
    if (denied) return denied;

    const start = new Date(`${input.dateFrom}T00:00:00`);
    const end = new Date(`${input.dateTo}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return { success: false, error: "Sana oralig'i noto'g'ri" };
    }

    const organizationId = session.organizationId;
    const createdAtRange = { gte: start, lte: end };
    const pointId = input.pointId || undefined;

    const [revenueAgg, returnsAgg, movements, writeOffAgg, expenseAgg, accruals] =
      await Promise.all([
        prisma.sale.aggregate({
          where: {
            organizationId,
            createdAt: createdAtRange,
            ...(pointId ? { pointId } : {}),
          },
          _sum: { totalAmount: true },
        }),
        prisma.saleReturn.aggregate({
          where: {
            organizationId,
            createdAt: createdAtRange,
            ...(pointId ? { sale: { pointId } } : {}),
          },
          _sum: { totalAmount: true },
        }),
        // COGS va yo'qotish uchun — bitta so'rovda hammasi.
        prisma.inventoryRegister.findMany({
          where: {
            organizationId,
            createdAt: createdAtRange,
            docType: { in: ["SALE", "SALE_RETURN", "ADJUSTMENT"] },
            ...(pointId
              ? { warehouseCell: { warehouse: { pointId } } }
              : {}),
          },
          select: { docType: true, direction: true, qty: true, unitCost: true },
        }),
        prisma.writeOff.aggregate({
          where: {
            organizationId,
            createdAt: createdAtRange,
            ...(pointId ? { pointId } : {}),
          },
          _sum: { totalAmount: true },
        }),
        prisma.cashFlow.aggregate({
          where: {
            organizationId,
            docType: "EXPENSE",
            direction: "OUT",
            createdAt: createdAtRange,
            ...(pointId ? { pointId } : {}),
          },
          _sum: { amount: true },
        }),
        prisma.payrollAccrual.findMany({
          where: {
            organizationId,
            status: "CONFIRMED",
            ...(pointId ? { pointId } : {}),
            OR: monthsBetween(start, end).map(({ year, month }) => ({ year, month })),
          },
          include: { lines: { select: { grossAmount: true } } },
        }),
      ]);

    const revenue = Number(revenueAgg._sum.totalAmount ?? 0);
    const returns = Number(returnsAgg._sum.totalAmount ?? 0);
    const netRevenue = revenue - returns;

    let saleOutCost = 0;
    let saleReturnInCost = 0;
    let writeOffCost = 0;
    for (const m of movements) {
      const cost = Number(m.qty) * Number(m.unitCost ?? 0);
      if (m.docType === "SALE" && m.direction === "OUT") saleOutCost += cost;
      else if (m.docType === "SALE_RETURN" && m.direction === "IN") saleReturnInCost += cost;
      else if (m.docType === "ADJUSTMENT" && m.direction === "OUT") writeOffCost += cost;
    }
    const cogs = saleOutCost - saleReturnInCost;
    const grossProfit = netRevenue - cogs;

    // writeOffCost (InventoryRegister'dan) va WriteOff.totalAmount bir xil
    // bo'lishi kerak — ikkalasi ham bor bo'lsa, hujjatdagi totalAmount'ni
    // asosiy manba sifatida olamiz (u yerda foydalanuvchi sabab bo'yicha
    // tuzatgan bo'lishi mumkin), ichki hisoblangani esa nazorat uchun.
    const writeOffLoss = Number(writeOffAgg._sum.totalAmount ?? 0) || writeOffCost;
    const manualExpenses = Number(expenseAgg._sum.amount ?? 0);

    type AccrualWithLines = { lines: { grossAmount: unknown }[] };
    const payrollExpense = (accruals as AccrualWithLines[]).reduce(
      (sum: number, acc: AccrualWithLines) =>
        sum +
        acc.lines.reduce(
          (s: number, l: { grossAmount: unknown }) => s + Number(l.grossAmount),
          0
        ),
      0
    );

    const totalExpenses = writeOffLoss + manualExpenses + payrollExpense;
    const netProfit = grossProfit - totalExpenses;

    return {
      success: true,
      data: {
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        revenue,
        returns,
        netRevenue,
        cogs,
        grossProfit,
        writeOffLoss,
        manualExpenses,
        payrollExpense,
        totalExpenses,
        netProfit,
      },
    };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Hisobotni hisoblashda xatolik yuz berdi." };
  }
}

// monthsBetween — [start, end] oralig'iga tegishli barcha (year, month)
// juftliklarini qaytaradi. Payroll oylik granulasiyada bo'lgani uchun
// (aniq kunlar bo'yicha emas), shu oylarning TO'LIQ accrual summasi
// hisobga olinadi — bu taxminiy, lekin oylik hisobotlar uchun to'g'ri.
function monthsBetween(start: Date, end: Date): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    result.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}
