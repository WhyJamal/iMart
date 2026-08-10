import type {
  SaleReturn,
  SaleReturnItem,
  Product,
  Sale,
} from "@/generated/prisma/client";

export type TSaleReturnItemWithProduct = SaleReturnItem & {
  product: Pick<Product, "id" | "name" | "code">;
};

export type TSaleReturnWithItems = SaleReturn & {
  sale: Pick<Sale, "id" | "saleNumber">;
  items: TSaleReturnItemWithProduct[];
};

export type TSerializedSaleReturnItem = Omit<
  TSaleReturnItemWithProduct,
  "qty" | "unitPrice"
> & {
  qty: number;
  unitPrice: number;
};

export type TSerializedSaleReturn = Omit<
  TSaleReturnWithItems,
  "totalAmount" | "items"
> & {
  totalAmount: number;
  items: TSerializedSaleReturnItem[];
};

export interface ISaleReturnItem {
  id: string;
  qty: number;
  unitPrice: number;
  product: { id: string; name: string; code: string };
}

export interface ISaleReturn {
  id: string;
  returnNumber: string;
  reason: string | null;
  paymentMethod: string;
  totalAmount: number;
  createdAt: Date;
  items: ISaleReturnItem[];
}

/**
 * findSaleForReturn() natijasi — har bir SaleItem uchun avval qancha
 * qaytarilgani va hali qancha qaytarish mumkinligi bilan birga.
 */
export interface ISaleItemReturnable {
  id: string; // SaleItem id
  productId: string;
  warehouseCellId: string | null;
  qty: number; // sotilgan miqdor
  unitPrice: number;
  returnedQty: number; // avval qaytarilgan miqdor
  returnableQty: number; // hali qaytarish mumkin bo'lgan miqdor
  product: { id: string; name: string; code: string };
}

export interface ISaleForReturn {
  id: string;
  saleNumber: string;
  createdAt: Date;
  items: ISaleItemReturnable[];
}
