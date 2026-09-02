import { getDashboardStats } from "@/actions/dashboard-actions";

import { StatCard } from "./_components/stat-card";
import { RevenueTrendChart } from "./_components/revenue-trend-chart";
import { MonthlyOverviewChart } from "./_components/monthly-overview-chart";
import { PaymentMethodChart } from "./_components/payment-method-chart";
import { TopProductsChart } from "./_components/top-products-chart";
import { PointRevenueChart } from "./_components/point-revenue-chart";

import {
  Wallet,
  Landmark,
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      labelKey: "todaySales",
      value: stats.todayRevenue.toLocaleString("uz-UZ"),
      icon: TrendingUp,
    },
    {
      labelKey: "monthlySales",
      value: stats.monthRevenue.toLocaleString("uz-UZ"),
      icon: ShoppingCart,
    },
    {
      labelKey: "monthlyPurchases",
      value: stats.monthPurchaseCost.toLocaleString("uz-UZ"),
      icon: Package,
    },
    {
      labelKey: "cash",
      value: stats.cashBalance.toLocaleString("uz-UZ"),
      icon: Wallet,
    },
    {
      labelKey: "bank",
      value: stats.bankBalance.toLocaleString("uz-UZ"),
      icon: Landmark,
    },
    {
      labelKey: "lowStock",
      value: String(stats.lowStockCount),
      icon: AlertTriangle,
      tone: "warning" as const,
    },
  ];

  return (
    <div className="space-y-6 p-10">
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat) => (
          <StatCard
            key={stat.labelKey}
            labelKey={stat.labelKey}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RevenueTrendChart data={stats.revenueTrend} />
        <MonthlyOverviewChart data={stats.monthlyOverview} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PaymentMethodChart data={stats.paymentBreakdown} />
        <TopProductsChart data={stats.topProducts} />
      </div>

      <div className="grid gap-6 xl:grid-cols-1">
        <PointRevenueChart data={stats.pointRevenue} />
      </div>
    </div>
  );
}