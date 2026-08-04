import type { Purchase, PurchaseItem, Product, Contragent } from "@/generated/prisma/client";

export type TPurchaseItemWithProduct = PurchaseItem & {
  product: Pick<Product, "id" | "name" | "code">;
};

export type TPurchaseWithItems = Purchase & {
  items: TPurchaseItemWithProduct[];
  contragent?: Pick<Contragent, "id" | "name"> | null;
};

export type TSerializedPurchaseItem = Omit<TPurchaseItemWithProduct, "qty" | "unitCost"> & {
  qty: number;
  unitCost: number;
};

export type TSerializedPurchase = Omit<TPurchaseWithItems, "items"> & {
  items: TSerializedPurchaseItem[];
  contragentName?: string | null;
};