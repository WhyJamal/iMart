import { getTranslations } from "next-intl/server";

import { getMaterialReport } from "@/actions/reports/material-report-actions";
import { getPointOptions } from "@/actions/point-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { getProducts } from "@/actions/product-actions";
import { getProductCategories } from "@/actions/product-category-actions";

import { MaterialReportView } from "./_components/material-report-view";

export const dynamic = "force-dynamic";

export default async function WarehouseReportPage() {
  const t = await getTranslations("material-report.warehouse");

  const [rows, points, warehouses, products, categories] = await Promise.all([
    getMaterialReport(),
    getPointOptions(),
    getWarehouses(),
    getProducts(),
    getProductCategories(),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {t("description")}
        </p>
      </div>

      <MaterialReportView
        initialRows={rows}
        points={points}
        warehouses={warehouses}
        products={products}
        categories={categories}
      />
    </div>
  );
}
