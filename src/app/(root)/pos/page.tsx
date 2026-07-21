import { getProducts } from "@/actions/product-actions";
import { getOrgStockMap } from "@/actions/purchase-actions";
import { getServerSession } from "@/lib/auth";
import POSTerminal from "./pos-terminal";
import { IProduct } from "@/types/product.types";
 
export const dynamic = "force-dynamic";
 
export default async function POSPage() {
  const session = await getServerSession();
  if (!session) return null;
 
  const [products, stockMap] = await Promise.all([
    getProducts(),
    getOrgStockMap(session.organizationId),
  ]);
 
  // Merge stock into product data
  const posProducts = products.map((p: IProduct) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    code: p.code,
    category: p.category,
    image: p.image,
    stock: stockMap.get(p.id) ?? 0,
  }));
 
  return <POSTerminal products={posProducts} />;
}