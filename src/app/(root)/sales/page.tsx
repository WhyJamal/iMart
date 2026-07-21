import { getSales } from "@/actions/sale-actions";
import { SaleList } from "./_components/sales-list";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const sales = await getSales();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sales</h1>
        <p className="text-muted-foreground text-sm mt-0.5">All completed transactions</p>
      </div>
      <SaleList sales={sales} />
    </div>
  );
}