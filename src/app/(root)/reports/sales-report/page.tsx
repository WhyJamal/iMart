import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShoppingCart } from "lucide-react";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { PAGES } from "@/config/pages.config";

import { getPointOptions } from "@/actions/point-actions";
import { getProductCategories } from "@/actions/product-category-actions";

import { SalesReportView } from "./_components/sales-report-view";

export const dynamic = "force-dynamic";

export default async function SalesReportPage() {
  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "reports:read")) {
    redirect(PAGES.HOME);
  }

  const t = await getTranslations("sales-report");

  const [points, categories] = await Promise.all([
    getPointOptions(),
    getProductCategories(),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {t("description")}
        </p>
      </div>

      <SalesReportView points={points} categories={categories} />
    </div>
  );
}
