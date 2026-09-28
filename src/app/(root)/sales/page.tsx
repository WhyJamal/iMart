import { getSales, getSaleFilterOptions } from "@/actions/sale-actions";
import { getTranslations } from "next-intl/server";
import { ListPagination } from "@/components/list/list-pagination";

import { SaleList } from "./_components/sales-list";
import { SaleFilters } from "./_components/sale-filters";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    createdBy?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { page, createdBy, paymentMethod, dateFrom, dateTo } =
    await searchParams;

  const [salesResult, filterOptions] = await Promise.all([
    getSales({
      page: page ? Number(page) : undefined,
      createdBy: createdBy || undefined,
      paymentMethod: paymentMethod || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    getSaleFilterOptions(),
  ]);

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

      <SaleFilters
        creators={filterOptions.creators}
        paymentMethods={filterOptions.paymentMethods}
      />

      <SaleList sales={salesResult.items} />

      <ListPagination
        page={salesResult.page}
        totalPages={salesResult.totalPages}
      />
    </div>
  );
}
