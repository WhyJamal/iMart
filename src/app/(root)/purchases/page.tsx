import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

import { getPurchases } from "@/actions/purchase-actions";
import { getProducts } from "@/actions/product-actions";
import { getPointOptions } from "@/actions/point-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { getContragentOptions } from "@/actions/contragent-actions";
import { getServerSession } from "@/lib/auth";

import { PurchaseList } from "./_components/purchase-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { PurchaseForm } from "./_components/purchase-form";
import { TSerializedPurchase } from "@/types/purchase.types";

export const dynamic = "force-dynamic";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  const { edit, new: isNew } = await searchParams;

  const session = await getServerSession();
  const purchases = await getPurchases();

  const t = await getTranslations("purchase.purchase");

  const editTarget = edit
    ? purchases.find(
        (p: TSerializedPurchase) => p.id === edit
      ) ?? null
    : null;

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

        <PurchaseList purchases={purchases} />
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