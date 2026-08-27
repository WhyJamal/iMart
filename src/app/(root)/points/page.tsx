import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPoints } from "@/actions/point-actions";
import { PointList } from "./_components/point-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { PointForm } from "./_components/point-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function PointsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const session = await getServerSession();
  if (!session || !hasPermission(session.role, "warehouses:manage")) {
    redirect(PAGES.HOME);
  }

  const { new: isNew, edit } = await searchParams;
  const points = await getPoints();
  const editTarget = edit ? points.find((p) => p.id === edit) : undefined;

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Points</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Tashkilotdagi nuqtalar (filiallar, foyda markazlari)
            </p>
          </div>
          <Button asChild>
            <Link href={`${PAGES.POINTS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              New point
            </Link>
          </Button>
        </div>

        <PointList points={points} canManage />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <PointForm />
      </DrawerBackdrop>

      <DrawerBackdrop isOpen={!!edit}>
        {editTarget && <PointForm point={editTarget} />}
      </DrawerBackdrop>
    </>
  );
}
