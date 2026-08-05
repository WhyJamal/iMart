export interface IWarehouseCell {
  id: string;
  name: string;
}

export interface IWarehouse {
  id: string;
  name: string;
  pointId: string;
  pointName: string;
  cells: IWarehouseCell[];
  createdAt: Date;
}

export interface IWarehouseOption {
  id: string;
  name: string;
  pointId: string;
}

// Sklad ustiga bosilganda pastda chiqadigan "shu skladdagi tovarlar" jadvali
export interface IWarehouseStockRow {
  cellId: string;
  cellName: string;
  productId: string;
  productName: string;
  productCode: string;
  qty: number;
}

// POS'da bitta mahsulot uchun qaysi yacheykalarda qancha bor ekani
// (eng ko'pidan kamiga saralangan)
export interface ICellStockOption {
  warehouseCellId: string;
  cellName: string;
  warehouseName: string;
  available: number;
}