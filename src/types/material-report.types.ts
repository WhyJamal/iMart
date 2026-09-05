// Material otchyot (ombor bo'yicha moddiy hisobot) — StockBalance asosida,
// har bir (mahsulot, sklad yacheykasi) bo'yicha joriy qoldiq + summa.
// Filtrlar: nomenklatura (mahsulot/kategoriya), sklad, nuqta.

export interface IMaterialReportFilters {
  pointId?: string;
  warehouseId?: string;
  categoryId?: string;
  productId?: string;
}

export interface IMaterialReportRow {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  categoryName: string;

  pointId: string;
  pointName: string;

  warehouseId: string;
  warehouseName: string;

  cellId: string;
  cellName: string;

  qty: number;
  price: number; // joriy o'rtacha tannarx (amount / qty)
  amount: number; // qty * price (StockBalance.amount)
}

export interface IMaterialReportTotals {
  qty: number;
  amount: number;
}
