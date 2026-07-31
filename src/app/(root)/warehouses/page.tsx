import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getWarehouses } from "@/actions/warehouse-actions";
import { getPointOptions } from "@/actions/point-actions";
import { WarehouseList } from "./_components/warehouse-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { WarehouseForm } from "./_components/warehouse-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function WarehousesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const session = await getServerSession();
  if (!session || !hasPermission(session.role, "warehouses:manage")) {
    redirect(PAGES.HOME);
  }

  const { new: isNew, edit } = await searchParams;

  const [warehouses, points] = await Promise.all([
    getWarehouses(),
    getPointOptions(),
  ]);
  const editTarget = edit ? warehouses.find((w) => w.id === edit) : undefined;

  return (
    <>
      <div className="p-6 space-y-6">
        <DrawerBackdrop isOpen={!!edit}>
          {editTarget && <WarehouseForm points={points} warehouse={editTarget} />}
        </DrawerBackdrop>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Warehouses</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Skladlar va ularning yacheykalari — nomiga bosing, ichidagi
              tovarlarni ko'ring
            </p>
          </div>
          <Button asChild disabled={points.length === 0}>
            <Link href={`${PAGES.WAREHOUSES}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              New warehouse
            </Link>
          </Button>
        </div>

        {points.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Avval kamida bitta Point yarating.
          </p>
        )}

        <WarehouseList warehouses={warehouses} canManage />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <WarehouseForm points={points} />
      </DrawerBackdrop>

    </>
  );
}
