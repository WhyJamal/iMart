import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { ListPagination } from "@/components/list/list-pagination";
import {
  getSaleReturns,
  getSaleReturnFilterOptions,
} from "@/actions/return-actions";
import { ReturnList } from "./_components/return-list";
import { ReturnForm } from "./_components/return-form";
import { ReturnFilters } from "./_components/return-filters";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    page?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const t = await getTranslations("sale-return");

  const sp = await searchParams;

  const [result, filterOptions] = await Promise.all([
    getSaleReturns({
      page: sp.page ? Number(sp.page) : undefined,
      createdBy: sp.createdBy,
      dateFrom: sp.dateFrom,
      dateTo: sp.dateTo,
    }),
    getSaleReturnFilterOptions(),
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
            <Link href={`${PAGES.RETURNS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              {t("newReturn")}
            </Link>
          </Button>
        </div>

        <ReturnFilters creators={filterOptions.creators} />

        <ReturnList returns={result.items} />

        <ListPagination page={result.page} totalPages={result.totalPages} />
      </div>

      <DrawerBackdrop isOpen={sp.new === "1"}>
        <ReturnForm />
      </DrawerBackdrop>
    </>
  );
}