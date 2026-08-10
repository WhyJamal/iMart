import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSaleReturns } from "@/actions/return-actions";
import { ReturnList } from "./_components/return-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { ReturnForm } from "./_components/return-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;

  const returns = await getSaleReturns();

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Returns</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Возврат товара — chekni topib, tovarni qaytaring
            </p>
          </div>
          <Button asChild>
            <Link href={`${PAGES.RETURNS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              New return
            </Link>
          </Button>
        </div>

        <ReturnList returns={returns} />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <ReturnForm />
      </DrawerBackdrop>
    </>
  );
}
