export interface IStockIntakeItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  warehouseCellId: string;
  warehouseCellName: string;
  warehouseName: string;
  qty: number;
  unitCost: number | null;
}

export interface IStockIntake {
  id: string;
  number: string;
  pointId: string | null;
  pointName: string | null;
  note: string | null;
  createdAt: string;
  items: IStockIntakeItem[];
}

export interface IStockIntakeListItem {
  id: string;
  number: string;
  pointName: string | null;
  itemsCount: number;
  totalQty: number;
  createdAt: string;
}
