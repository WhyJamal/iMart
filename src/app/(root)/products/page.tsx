import { getProducts } from "../../../actions/product-actions";
import { getProductCategories } from "../../../actions/product-category-actions";
import { ProductsClient } from "./_components/products-client";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getProductCategories(),
  ]);
  return <ProductsClient initialProducts={products} categories={categories} />;
}
