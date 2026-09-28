import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

import {
  getPurchases,
  getPurchaseById,
  getPurchaseFilterOptions,
} from "@/actions/purchase-actions";
import { getProducts } from "@/actions/product-actions";
import { getPointOptions } from "@/actions/point-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { getContragentOptions } from "@/actions/contragent-actions";
import { getServerSession } from "@/lib/auth";

import { PurchaseList } from "./_components/purchase-list";
import { PurchaseFilters } from "./_components/purchase-filters";
import { ListPagination } from "@/components/list/list-pagination";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { PurchaseForm } from "./_components/purchase-form";

export const dynamic = "force-dynamic";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    new?: string;
    page?: string;
    contragentId?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const {
    edit,
    new: isNew,
    page,
    contragentId,
    createdBy,
    dateFrom,
    dateTo,
  } = await searchParams;

  const session = await getServerSession();

  const [purchasesResult, filterOptions] = await Promise.all([
    getPurchases({
      page: page ? Number(page) : undefined,
      contragentId: contragentId || undefined,
      createdBy: createdBy || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    getPurchaseFilterOptions(),
  ]);

  const t = await getTranslations("purchase");

  // Tahrirlash uchun hujjatni har doim to'g'ridan-to'g'ri o'ziga xos
  // so'rov bilan olamiz — u joriy filtr/sahifada ko'rinmayotgan bo'lishi
  // mumkin, va shakli (product.price bilan) ro'yxatdagidan farq qiladi.
  const editTarget = edit ? await getPurchaseById(edit) : null;

  const isOpen = !!editTarget || isNew === "1";

  const [products, points, warehouses, contragents] = isOpen
    ? await Promise.all([
        getProducts(),
        getPointOptions(),
        getWarehouses(),
        getContragentOptions("SUPPLIER"),
      ])
    : [[], [], [], []];

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t("title")}
            </h1>

            <p className="text-muted-foreground text-sm mt-0.5">
              {t("description")}
            </p>
          </div>

          <Button asChild>
            <Link href="/purchases?new=1">
              <Plus className="w-4 h-4 mr-1" />
              {t("newPurchase")}
            </Link>
          </Button>
        </div>

        <PurchaseFilters
          contragents={filterOptions.contragents}
          creators={filterOptions.creators}
        />

        <PurchaseList purchases={purchasesResult.items} />

        <ListPagination
          page={purchasesResult.page}
          totalPages={purchasesResult.totalPages}
        />
      </div>

      <DrawerBackdrop isOpen={isOpen}>
        {editTarget ? (
          <PurchaseForm
            products={products}
            points={points}
            warehouses={warehouses}
            contragents={contragents}
            defaultPointId={session?.pointId ?? null}
            initialData={editTarget}
          />
        ) : (
          isNew === "1" && (
            <PurchaseForm
              products={products}
              points={points}
              warehouses={warehouses}
              contragents={contragents}
              defaultPointId={session?.pointId ?? null}
            />
          )
        )}
      </DrawerBackdrop>
    </>
  );
}