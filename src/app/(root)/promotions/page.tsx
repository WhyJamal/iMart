import Link from "next/link";
import { Plus, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { getPromotions } from "@/actions/promotion-actions";
import { getPointOptions, getCurrentUserPointId } from "@/actions/point-actions";
import { getWarehouses, getPointCellStock } from "@/actions/warehouse-actions";
import { getProducts } from "@/actions/product-actions";

import { PromotionForm } from "./_components/promotion-form";
import { PromotionList } from "./_components/promotion-list";

export const dynamic = "force-dynamic";

export default async function PromotionsPage({
  searchParams,
}: { searchParams: Promise<{ new?: string }> }) {
  const { new: isNew } = await searchParams;
  const promotions = await getPromotions();
  const isOpen = isNew === "1";
  let points = await getPointOptions();
  let warehouses = [] as Awaited<ReturnType<typeof getWarehouses>>;
  let products = [] as Awaited<ReturnType<typeof getProducts>>;
  let defaultPointId: string | null = null;
  let initialCellStock = {} as Awaited<ReturnType<typeof getPointCellStock>>;
  if (isOpen) {
    [warehouses, products, defaultPointId] = await Promise.all([getWarehouses(), getProducts(), getCurrentUserPointId()]);
    if (defaultPointId) initialCellStock = await getPointCellStock(defaultPointId);
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Percent className="w-6 h-6" /> Акции</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Скидки на товары только в выбранном складе и до указанной даты</p>
          </div>
          <Button asChild><Link href="/promotions?new=1"><Plus className="w-4 h-4 mr-1" /> Новая акция</Link></Button>
        </div>
        <PromotionList promotions={promotions} />
      </div>

      <DrawerBackdrop isOpen={isOpen}>
        {isOpen && <PromotionForm points={points} warehouses={warehouses} products={products} defaultPointId={defaultPointId} initialCellStock={initialCellStock} />}
      </DrawerBackdrop>
    </>
  );
}
