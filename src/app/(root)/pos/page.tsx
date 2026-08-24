import { getProducts } from "@/actions/product-actions";
import { getPointStockMap, getPointCellStock } from "@/actions/warehouse-actions";
import { getPointOptions } from "@/actions/point-actions";
import { getServerSession } from "@/lib/auth";
import POSTerminal from "./pos-terminal";
import { IProduct } from "@/types/product.types";
 
export const dynamic = "force-dynamic";
 
export default async function POSPage() {
  const session = await getServerSession();
  if (!session) return null;

  const points = await getPointOptions();
  const defaultPointId = session.pointId ?? points[0]?.id ?? "";

  const [products, stockMap, cellStock] = await Promise.all([
    getProducts(),
    defaultPointId ? getPointStockMap(defaultPointId) : Promise.resolve(new Map<string, number>()),
    defaultPointId ? getPointCellStock(defaultPointId) : Promise.resolve({}),
  ]);
 
  // Merge stock into product data
  const posProducts = products.map((p: IProduct) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    code: p.code,
    category: p.categoryName,
    unit: p.unit,
    image: p.image,
    stock: stockMap.get(p.id) ?? 0,
  }));
 
  return (
    <POSTerminal
      products={posProducts}
      points={points}
      defaultPointId={defaultPointId}
      initialCellStock={cellStock}
    />
  );
}