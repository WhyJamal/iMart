import Link from "next/link";
import { Plus, Percent } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { ListPagination } from "@/components/list/list-pagination";
import {
  getPromotions,
  getPromotionFilterOptions,
} from "@/actions/promotion-actions";
import { getPointOptions, getCurrentUserPointId } from "@/actions/point-actions";
import { getWarehouses, getPointCellStock } from "@/actions/warehouse-actions";
import { getProducts } from "@/actions/product-actions";
import { PromotionForm } from "./_components/promotion-form";
import { PromotionList } from "./_components/promotion-list";
import { PromotionFilters } from "./_components/promotion-filters";

export const dynamic = "force-dynamic";

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    new?: string;
    page?: string;
    q?: string;
    pointId?: string;
    warehouseId?: string;
    warehouseCellId?: string;
    createdBy?: string;
  }>;
}) {
  const t = await getTranslations("promotion");

  const sp = await searchParams;
  const isOpen = sp.new === "1";

  const [result, filterOptions, points] = await Promise.all([
    getPromotions({
      page: sp.page ? Number(sp.page) : undefined,
      q: sp.q,
      pointId: sp.pointId,
      warehouseId: sp.warehouseId,
      warehouseCellId: sp.warehouseCellId,
      createdBy: sp.createdBy,
    }),
    getPromotionFilterOptions(),
    getPointOptions(),
  ]);

  let warehouses = [] as Awaited<ReturnType<typeof getWarehouses>>;
  let products = [] as Awaited<ReturnType<typeof getProducts>>;
  let defaultPointId: string | null = null;
  let initialCellStock = {} as Awaited<ReturnType<typeof getPointCellStock>>;

  if (isOpen) {
    [warehouses, products, defaultPointId] = await Promise.all([
      getWarehouses(),
      getProducts(),
      getCurrentUserPointId(),
    ]);

    if (defaultPointId) {
      initialCellStock = await getPointCellStock(defaultPointId);
    }
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Percent className="w-6 h-6" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {t("description")}
            </p>
          </div>

          <Button asChild>
            <Link href="/promotions?new=1">
              <Plus className="w-4 h-4 mr-1" />
              {t("newPromotion")}
            </Link>
          </Button>
        </div>

        <PromotionFilters
          points={filterOptions.points}
          warehouses={filterOptions.warehouses}
          cells={filterOptions.cells}
          creators={filterOptions.creators}
        />

        <PromotionList promotions={result.items} query={sp.q ?? ""} />

        <ListPagination page={result.page} totalPages={result.totalPages} />
      </div>

      <DrawerBackdrop isOpen={isOpen}>
        {isOpen && (
          <PromotionForm
            points={points}
            warehouses={warehouses}
            products={products}
            defaultPointId={defaultPointId}
            initialCellStock={initialCellStock}
          />
        )}
      </DrawerBackdrop>
    </>
  );
}