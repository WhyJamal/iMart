import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { getTransfers } from "@/actions/transfer-actions";
import {
  getPointOptions,
  getCurrentUserPointId,
} from "@/actions/point-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { TransferList } from "./_components/transfer-list";
import { TransferForm } from "./_components/transfer-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const t = await getTranslations("transfer");

  const { new: isNew } = await searchParams;
  const transfers = await getTransfers();

  const [points, defaultPointId] =
    isNew === "1"
      ? await Promise.all([
          getPointOptions(),
          getCurrentUserPointId(),
        ])
      : [[], null];

  const warehouses =
    isNew === "1" ? await getWarehouses() : [];

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
            <Link href={`${PAGES.TRANSFERS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              {t("newTransfer")}
            </Link>
          </Button>
        </div>

        <TransferList transfers={transfers} />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        {isNew === "1" && (
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