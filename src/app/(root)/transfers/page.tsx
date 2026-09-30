import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { ListPagination } from "@/components/list/list-pagination";
import {
  getTransfers,
  getTransferFilterOptions,
} from "@/actions/transfer-actions";
import {
  getPointOptions,
  getCurrentUserPointId,
} from "@/actions/point-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { TransferList } from "./_components/transfer-list";
import { TransferForm } from "./_components/transfer-form";
import { TransferFilters } from "./_components/transfer-filters";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    page?: string;
    fromPointId?: string;
    toPointId?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const t = await getTranslations("transfer");

  const sp = await searchParams;
  const isOpen = sp.new === "1";

  const [result, filterOptions] = await Promise.all([
    getTransfers({
      page: sp.page ? Number(sp.page) : undefined,
      fromPointId: sp.fromPointId,
      toPointId: sp.toPointId,
      createdBy: sp.createdBy,
      dateFrom: sp.dateFrom,
      dateTo: sp.dateTo,
    }),
    getTransferFilterOptions(),
  ]);

  const [points, defaultPointId] = isOpen
    ? await Promise.all([getPointOptions(), getCurrentUserPointId()])
    : [[], null];

  const warehouses = isOpen ? await getWarehouses() : [];

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
            <Link href={`${PAGES.TRANSFERS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              {t("newTransfer")}
            </Link>
          </Button>
        </div>

        <TransferFilters
          points={filterOptions.points}
          creators={filterOptions.creators}
        />

        <TransferList transfers={result.items} />

        <ListPagination page={result.page} totalPages={result.totalPages} />
      </div>

      <DrawerBackdrop isOpen={isOpen}>
        {isOpen && (
          <TransferForm
            points={points}
            warehouses={warehouses}
            defaultPointId={defaultPointId}
          />
        )}
      </DrawerBackdrop>
    </>
  );
}