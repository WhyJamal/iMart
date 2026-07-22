import { getDashboardStats } from "@/actions/dashboard-actions";

import { StatCard } from "./_components/stat-card";
import { RevenueTrendChart } from "./_components/revenue-trend-chart";
import { MonthlyOverviewChart } from "./_components/monthly-overview-chart";
import { PaymentMethodChart } from "./_components/payment-method-chart";
import { TopProductsChart } from "./_components/top-products-chart";

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

  return (
    <div className="space-y-6 p-10">

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Bugungi savdo"
          value={stats.todayRevenue.toLocaleString("uz-UZ")}
          icon={TrendingUp}
        />

        <StatCard
          label="Oylik savdo"
          value={stats.monthRevenue.toLocaleString("uz-UZ")}
          icon={ShoppingCart}
        />

        <StatCard
          label="Oylik xarid"
          value={stats.monthPurchaseCost.toLocaleString("uz-UZ")}
          icon={Package}
        />

        <StatCard
          label="Kassa"
          value={stats.cashBalance.toLocaleString("uz-UZ")}
          icon={Wallet}
        />

        <StatCard
          label="Bank"
          value={stats.bankBalance.toLocaleString("uz-UZ")}
          icon={Landmark}
        />

        <StatCard
          label="Kam qolgan mahsulotlar"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
          tone="warning"
        />
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

    </div>
  );
}