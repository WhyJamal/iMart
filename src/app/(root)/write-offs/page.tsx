import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { ListPagination } from "@/components/list/list-pagination";
import {
  getWriteOffs,
  getWriteOffFilterOptions,
} from "@/actions/write-off-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { getCurrentUserPointId, getPointOptions } from "@/actions/point-actions";
import { WriteOffList } from "./_components/write-off-list";
import { WriteOffForm } from "./_components/write-off-form";
import { WriteOffFilters } from "./_components/write-off-filters";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function WriteOffsPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    page?: string;
    pointId?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const t = await getTranslations("write-off");

  const sp = await searchParams;
  const isOpen = sp.new === "1";

  const [result, filterOptions] = await Promise.all([
    getWriteOffs({
      page: sp.page ? Number(sp.page) : undefined,
      pointId: sp.pointId,
      createdBy: sp.createdBy,
      dateFrom: sp.dateFrom,
      dateTo: sp.dateTo,
    }),
    getWriteOffFilterOptions(),
  ]);

  const points = isOpen ? await getPointOptions() : [];
  const defaultPointId = isOpen ? await getCurrentUserPointId() : null;

  const warehouses =
    isOpen && defaultPointId ? await getWarehouses() : [];

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
            <Link href={`${PAGES.WRITE_OFFS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              {t("newWriteOff")}
            </Link>
          </Button>
        </div>

        <WriteOffFilters
          points={filterOptions.points}
          creators={filterOptions.creators}
        />

        <WriteOffList writeOffs={result.items} />

        <ListPagination page={result.page} totalPages={result.totalPages} />
      </div>

      <DrawerBackdrop isOpen={isOpen}>
        {isOpen && (
          <WriteOffForm
            warehouses={warehouses}
            points={points}
            defaultPointId={defaultPointId}
          />
        )}
      </DrawerBackdrop>
    </>
  );
}