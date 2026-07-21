import { getProducts } from "../../../actions/product-actions";
import { ProductsClient } from "./_components/products-client";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsClient initialProducts={products} />;
}