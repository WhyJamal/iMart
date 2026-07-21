import type { Sale, SaleItem, Product } from "@/generated/prisma/client";

export type TSaleItemWithProduct = SaleItem & {
  product: Pick<Product, "id" | "name" | "code">;
};

export type TSaleWithItems = Sale & {
  items: TSaleItemWithProduct[];
};

export type TSerializedSaleItem = Omit<
  TSaleItemWithProduct,
  "qty" | "unitPrice"
> & {
  qty: number;
  unitPrice: number;
};

export type TSerializedSale = Omit<
  TSaleWithItems,
  "totalAmount" | "items"
> & {
  totalAmount: number;
  items: TSerializedSaleItem[];
};

export interface ISaleItem {
  id: string;
  qty: number;
  unitPrice: number;
  product: { id: string; name: string; code: string };
}
 
export interface ISale {
  id: string;
  saleNumber: number;
  totalAmount: number;
  createdAt: Date;
  items: SaleItem[];
}