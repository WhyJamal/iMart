export interface ISalesReportFilters {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  pointId?: string;
  categoryId?: string;
}

/**
 * Sotishlar hisobotidagi bitta qator — bitta mahsulot bo'yicha,
 * berilgan davr va filtrlar (nuqta, kategoriya) doirasida.
 *
 * qty/revenue — sotilgan (qaytarishlar AYIRILGAN, ya'ni sof) miqdor
 * va summa. cost — shu sotuvlar uchun yozib qo'yilgan haqiqiy tannarx
 * (InventoryRegister'dagi unitCost asosida). profit = revenue - cost.
 */
export interface ISalesReportRow {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  categoryName: string;

  qty: number;
  avgPrice: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number; // profit / revenue * 100, revenue=0 bo'lsa 0
}

export interface ISalesReportTotals {
  qty: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
}

export interface ISalesReport {
  rows: ISalesReportRow[];
  totals: ISalesReportTotals;
}
