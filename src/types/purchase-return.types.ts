import type {
  PurchaseReturn,
  PurchaseReturnItem,
  Product,
  Purchase,
} from "@/generated/prisma/client";

export type TPurchaseReturnItemWithProduct = PurchaseReturnItem & {
  product: Pick<Product, "id" | "name" | "code">;
};

export type TPurchaseReturnWithItems = PurchaseReturn & {
  purchase: Pick<Purchase, "id" | "receiptNumber" | "supplierName">;
  items: TPurchaseReturnItemWithProduct[];
};

export type TSerializedPurchaseReturnItem = Omit<
  TPurchaseReturnItemWithProduct,
  "qty" | "unitCost"
> & {
  qty: number;
  unitCost: number;
};

export type TSerializedPurchaseReturn = Omit<
  TPurchaseReturnWithItems,
  "totalAmount" | "items"
> & {
  totalAmount: number;
  items: TSerializedPurchaseReturnItem[];
};

export interface IPurchaseReturnItem {
  id: string;
  qty: number;
  unitCost: number;
  product: { id: string; name: string; code: string };
}

export interface IPurchaseReturn {
  id: string;
  returnNumber: string;
  reason: string | null;
  paymentMethod: string;
  totalAmount: number;
  createdAt: Date;
  items: IPurchaseReturnItem[];
}

/**
 * findPurchaseForReturn() natijasi — har bir PurchaseItem uchun avval
 * qancha qaytarilgani va hali qancha qaytarish mumkinligi bilan birga.
 */
export interface IPurchaseItemReturnable {
  id: string; // PurchaseItem id
  productId: string;
  qty: number; // olingan (xarid qilingan) miqdor
  unitCost: number;
  returnedQty: number; // avval qaytarilgan miqdor
  returnableQty: number; // hali qaytarish mumkin bo'lgan miqdor
  product: { id: string; name: string; code: string };
}

export interface IPurchaseForReturn {
  id: string;
  receiptNumber: string;
  supplierName: string | null;
  createdAt: Date;
  items: IPurchaseItemReturnable[];
}
