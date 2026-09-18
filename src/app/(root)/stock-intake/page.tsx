import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

import {
  getStockIntakes,
  getStockIntakeById,
} from "@/actions/stock-intake-actions";
import { getProducts } from "@/actions/product-actions";
import { getPointOptions } from "@/actions/point-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { PAGES } from "@/config/pages.config";

import { StockIntakeList } from "./_components/stock-intake-list";
import { StockIntakeUploadButton } from "./_components/stock-intake-upload-button";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { StockIntakeForm } from "./_components/stock-intake-form";

export const dynamic = "force-dynamic";

export default async function StockIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  const { edit, new: isNew } = await searchParams;

  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "stock-intake:create")) {
    redirect(PAGES.HOME);
  }

  const [intakes, products, points, warehouses] = await Promise.all([
    getStockIntakes(),
    getProducts(),
    getPointOptions(),
    getWarehouses(),
  ]);

  const t = await getTranslations("stock-intake");

  const editTarget = edit ? await getStockIntakeById(edit) : null;
  const isOpen = !!editTarget || isNew === "1";

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

          <div className="flex gap-2">
            <StockIntakeUploadButton
              products={products}
              points={points}
              warehouses={warehouses}
              defaultPointId={session?.pointId ?? null}
            />
            <Button asChild>
              <Link href="/stock-intake?new=1">
                <Plus className="w-4 h-4 mr-1" />
                {t("newDocument")}
              </Link>
            </Button>
          </div>
        </div>

        <StockIntakeList intakes={intakes} />
      </div>

      <DrawerBackdrop isOpen={isOpen}>
        {editTarget ? (
          <StockIntakeForm
            products={products}
            points={points}
            warehouses={warehouses}
            defaultPointId={session?.pointId ?? null}
            initialData={editTarget}
          />
        ) : (
          isNew === "1" && (
            <StockIntakeForm
              products={products}
              points={points}
              warehouses={warehouses}
              defaultPointId={session?.pointId ?? null}
            />
          )
        )}
      </DrawerBackdrop>
    </>
  );
}
