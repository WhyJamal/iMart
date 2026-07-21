import type { Purchase, PurchaseItem, Product } from "@/generated/prisma/client";

export type TPurchaseItemWithProduct = PurchaseItem & {
  product: Pick<Product, "id" | "name" | "code">;
};

export type TPurchaseWithItems = Purchase & {
  items: TPurchaseItemWithProduct[];
};

export type TSerializedPurchaseItem = Omit<TPurchaseItemWithProduct, "qty" | "unitCost"> & {
  qty: number;
  unitCost: number;
};

export type TSerializedPurchase = Omit<TPurchaseWithItems, "items"> & {
  items: TSerializedPurchaseItem[];
};