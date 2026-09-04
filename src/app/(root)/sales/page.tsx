import { getSales } from "@/actions/sale-actions";
import { getTranslations } from "next-intl/server";

import { SaleList } from "./_components/sales-list";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const sales = await getSales();
  const t = await getTranslations("sales");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("title")}
        </h1>

        <p className="text-muted-foreground text-sm mt-0.5">
          {t("description")}
        </p>
      </div>

      <SaleList sales={sales} />
    </div>
  );
}