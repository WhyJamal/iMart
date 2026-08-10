import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPurchaseReturns } from "@/actions/purchase-return-actions";
import { PurchaseReturnList } from "./_components/purchase-return-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { PurchaseReturnForm } from "./_components/purchase-return-form";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function PurchaseReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;

  const returns = await getPurchaseReturns();

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Supplier returns</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Ta'minotchiga tovar qaytarish — eskirgan/nosoz tovarlar uchun
            </p>
          </div>
          <Button asChild>
            <Link href={`${PAGES.PURCHASE_RETURNS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              New return
            </Link>
          </Button>
        </div>

        <PurchaseReturnList returns={returns} />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <PurchaseReturnForm />
      </DrawerBackdrop>
    </>
  );
}
