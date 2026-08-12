import type { WriteOff, WriteOffItem, Product, WarehouseCell, Point } from "@/generated/prisma/client";

export type TWriteOffItemWithRelations = WriteOffItem & {
  product: Pick<Product, "id" | "name" | "code">;
  warehouseCell: Pick<WarehouseCell, "id" | "name">;
};

export type TWriteOffWithItems = WriteOff & {
  point: Pick<Point, "id" | "name"> | null;
  items: TWriteOffItemWithRelations[];
};

export type TSerializedWriteOffItem = Omit<
  TWriteOffItemWithRelations,
  "qty" | "unitCost"
> & {
  qty: number;
  unitCost: number;
};

export type TSerializedWriteOff = Omit<TWriteOffWithItems, "totalAmount" | "items"> & {
  totalAmount: number;
  items: TSerializedWriteOffItem[];
};

/**
 * Yacheykani tanlaganda formada ko'rsatiladigan — shu yacheykadagi
 * hozirgi qoldiqli mahsulotlar ro'yxati (getWarehouseStock() natijasidan
 * bitta cellId bo'yicha filtrlanadi).
 */
export interface IWriteOffStockRow {
  cellId: string;
  cellName: string;
  productId: string;
  productName: string;
  productCode: string;
  qty: number;
  price: number; // joriy o'rtacha tannarx (ItemPrice)
}