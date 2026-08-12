import Link from "next/link";
import { FileMinus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWriteOffs } from "@/actions/write-off-actions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { getCurrentUserPointId, getPointOptions } from "@/actions/point-actions";
import { WriteOffList } from "./_components/write-off-list";
import { WriteOffForm } from "./_components/write-off-form";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function WriteOffsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  const writeOffs = await getWriteOffs();

  const points = isNew === "1" ? await getPointOptions() : [];
  const defaultPointId = isNew === "1" ? await getCurrentUserPointId() : null;
  const warehouses =
    isNew === "1" && defaultPointId
      ? await getWarehouses(defaultPointId)
      : [];

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Списание товаров</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Списание товаров со склада по причине порчи, брака, недостачи и т. д.
            </p>
          </div>
          <Button asChild>
            <Link href={`${PAGES.WRITE_OFFS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              Новое списание
            </Link>
          </Button>
        </div>

        <WriteOffList writeOffs={writeOffs} />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        {isNew === "1" && (
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
