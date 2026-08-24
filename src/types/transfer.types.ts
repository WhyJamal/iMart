export interface ITransferStockRow {
  cellId: string;
  cellName: string;
  productId: string;
  productName: string;
  productCode: string;
  qty: number;
  price: number;
}

export interface TSerializedTransferItem {
  id: string;
  product: { id: string; name: string; code: string };
  fromCell: { id: string; name: string };
  toCell: { id: string; name: string };
  qty: number;
  unitCost: number;
}

export interface TSerializedTransfer {
  id: string;
  transferNumber: string;
  fromPoint: { id: string; name: string };
  toPoint: { id: string; name: string };
  note: string | null;
  totalAmount: number;
  createdBy: string | null;
  createdAt: Date;
  items: TSerializedTransferItem[];
}
