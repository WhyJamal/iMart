import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { ListPagination } from "@/components/list/list-pagination";
import {
  getPurchaseReturns,
  getPurchaseReturnFilterOptions,
} from "@/actions/purchase-return-actions";
import { PurchaseReturnList } from "./_components/purchase-return-list";
import { PurchaseReturnForm } from "./_components/purchase-return-form";
import { PurchaseReturnFilters } from "./_components/purchase-return-filters";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function PurchaseReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    page?: string;
    contragentId?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const t = await getTranslations("purchase-return");

  const sp = await searchParams;

  const [result, filterOptions] = await Promise.all([
    getPurchaseReturns({
      page: sp.page ? Number(sp.page) : undefined,
      contragentId: sp.contragentId,
      createdBy: sp.createdBy,
      dateFrom: sp.dateFrom,
      dateTo: sp.dateTo,
    }),
    getPurchaseReturnFilterOptions(),
  ]);

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {t("description")}
            </p>
          </div>

          <Button asChild>
            <Link href={`${PAGES.PURCHASE_RETURNS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              {t("newReturn")}
            </Link>
          </Button>
        </div>

        <PurchaseReturnFilters
          contragents={filterOptions.contragents}
          creators={filterOptions.creators}
        />

        <PurchaseReturnList returns={result.items} />

        <ListPagination page={result.page} totalPages={result.totalPages} />
      </div>

      <DrawerBackdrop isOpen={sp.new === "1"}>
        <PurchaseReturnForm />
      </DrawerBackdrop>
    </>
  );
}