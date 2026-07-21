import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPurchases, getPurchaseById } from "@/actions/purchase-actions";
import { getProducts } from "@/actions/product-actions";
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

  const purchases = await getPurchases();

  const editTarget = edit
    ? purchases.find((p: TSerializedPurchase) => p.id === edit) ?? null
    : null;

  const products = (editTarget || isNew) ? await getProducts() : [];

  return (
    <div className="p-6 space-y-6">

      {editTarget && (
        <DrawerBackdrop>
          <PurchaseForm products={products} initialData={editTarget} />
        </DrawerBackdrop>
      )}

      {isNew && !editTarget && (
        <DrawerBackdrop>
          <PurchaseForm products={products} />
        </DrawerBackdrop>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Inventory receipts — each purchase increases stock
          </p>
        </div>
        <Button asChild>
          <Link href="/purchases?new=1">
            <Plus className="w-4 h-4 mr-1" />
            New purchase
          </Link>
        </Button>
      </div>

      <PurchaseList purchases={purchases} />
    </div>
  );
}