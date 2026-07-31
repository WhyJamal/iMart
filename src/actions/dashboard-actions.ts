"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { getCashRegister, getBankAccount } from "@/actions/cash-actions";
import { getOrgStockMap } from "@/actions/purchase-actions";

const UZ_MONTHS = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyun",
  "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek",
];

const LOW_STOCK_THRESHOLD = 5;

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export type TDashboardStats = {
  todayRevenue: number;
  monthRevenue: number;
  monthPurchaseCost: number;
  cashBalance: number;
  bankBalance: number;
  totalProducts: number;
  lowStockCount: number;
  revenueTrend: { label: string; savdo: number; xarid: number }[];
  monthlyOverview: { label: string; savdo: number; xarid: number }[];
  paymentBreakdown: { method: string; amount: number; fill: string }[];
  topProducts: { name: string; revenue: number }[];
};

export async function getDashboardStats(): Promise<TDashboardStats> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");
  const organizationId = session.organizationId;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const fourteenDaysAgo = new Date(startOfToday);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [
    saleRows,
    purchaseItemRows,
    products,
    stockMap,
    cashRegister,
    bankAccount,
    monthSaleItems,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: { organizationId, createdAt: { gte: sixMonthsAgo } },
      select: { totalAmount: true, paymentMethod: true, createdAt: true },
    }),
    prisma.purchaseItem.findMany({
      where: { receipt: { organizationId, createdAt: { gte: sixMonthsAgo } } },
      select: {
        qty: true,
        unitCost: true,
        receipt: { select: { createdAt: true } },
      },
    }),
    prisma.product.findMany({
      where: { organizationId },
      select: { id: true },
    }),
    getOrgStockMap(organizationId),
    getCashRegister(),
    getBankAccount(),
    prisma.saleItem.findMany({
      where: { sale: { organizationId, createdAt: { gte: startOfMonth } } },
      select: {
        qty: true,
        unitPrice: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  // ── Summary numbers ──────────────────────────────────────────────
  let todayRevenue = 0;
  let monthRevenue = 0;
  const paymentTotals = new Map<string, number>();

  for (const sale of saleRows) {
    const amount = Number(sale.totalAmount);
    if (sale.createdAt >= startOfToday) todayRevenue += amount;
    if (sale.createdAt >= startOfMonth) monthRevenue += amount;

    const method = sale.paymentMethod || "cash";
    paymentTotals.set(method, (paymentTotals.get(method) ?? 0) + amount);
  }

  let monthPurchaseCost = 0;
  for (const item of purchaseItemRows) {
    const cost = Number(item.qty) * Number(item.unitCost ?? 0);
    if (item.receipt.createdAt >= startOfMonth) monthPurchaseCost += cost;
  }

  const lowStockCount = products.filter(
    (p: { id: string }) => (stockMap.get(p.id) ?? 0) < LOW_STOCK_THRESHOLD
  ).length;

  // ── 14-day daily trend (savdo vs xarid) ──────────────────────────
  const dailyBuckets = new Map<string, { label: string; savdo: number; xarid: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    dailyBuckets.set(dateKey(d), {
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      savdo: 0,
      xarid: 0,
    });
  }
  for (const sale of saleRows) {
    if (sale.createdAt < fourteenDaysAgo) continue;
    const bucket = dailyBuckets.get(dateKey(sale.createdAt));
    if (bucket) bucket.savdo += Number(sale.totalAmount);
  }
  for (const item of purchaseItemRows) {
    if (item.receipt.createdAt < fourteenDaysAgo) continue;
    const bucket = dailyBuckets.get(dateKey(item.receipt.createdAt));
    if (bucket) bucket.xarid += Number(item.qty) * Number(item.unitCost ?? 0);
  }
  const revenueTrend = Array.from(dailyBuckets.values());

  // ── 6-month overview (savdo vs xarid) ────────────────────────────
  const monthlyBuckets = new Map<string, { label: string; savdo: number; xarid: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
    monthlyBuckets.set(monthKey(d), {
      label: UZ_MONTHS[d.getMonth()],
      savdo: 0,
      xarid: 0,
    });
  }
  for (const sale of saleRows) {
    const bucket = monthlyBuckets.get(monthKey(sale.createdAt));
    if (bucket) bucket.savdo += Number(sale.totalAmount);
  }
  for (const item of purchaseItemRows) {
    const bucket = monthlyBuckets.get(monthKey(item.receipt.createdAt));
    if (bucket) bucket.xarid += Number(item.qty) * Number(item.unitCost ?? 0);
  }
  const monthlyOverview = Array.from(monthlyBuckets.values());

  // ── Payment method breakdown (pie) ───────────────────────────────
  const paymentColors: Record<string, string> = {
    cash: "var(--color-chart-1)",
    card: "var(--color-chart-2)",
    qr: "var(--color-chart-3)",
  };
  const paymentLabels: Record<string, string> = {
    cash: "Naqd",
    card: "Karta",
    qr: "QR",
  };
  const paymentBreakdown = Array.from(paymentTotals.entries()).map(([method, amount]) => ({
    method: paymentLabels[method] ?? method,
    amount,
    fill: paymentColors[method] ?? "var(--color-chart-4)",
  }));

  // ── Top 5 products this month (bar) ──────────────────────────────
  const productTotals = new Map<string, number>();
  for (const item of monthSaleItems) {
    const revenue = Number(item.qty) * Number(item.unitPrice);
    const name = item.product.name;
    productTotals.set(name, (productTotals.get(name) ?? 0) + revenue);
  }
  const topProducts = Array.from(productTotals.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    todayRevenue,
    monthRevenue,
    monthPurchaseCost,
    cashBalance: cashRegister.balance,
    bankBalance: bankAccount.balance,
    totalProducts: products.length,
    lowStockCount,
    revenueTrend,
    monthlyOverview,
    paymentBreakdown,
    topProducts,
  };
}