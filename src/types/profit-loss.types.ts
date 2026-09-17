export interface IProfitLossReport {
  dateFrom: string;
  dateTo: string;

  revenue: number; // yalpi tushum (savdolar, soliq bilan)
  returns: number; // qaytarishlar
  netRevenue: number; // revenue - returns

  cogs: number; // sotilgan tovarlar tannarxi (COGS)
  grossProfit: number; // netRevenue - cogs

  writeOffLoss: number; // spisaniye (yo'qotish)
  manualExpenses: number; // qo'lda kiritilgan xarajatlar (ijaraga, kommunal va h.k.)
  payrollExpense: number; // oylik (accrual asosida)
  totalExpenses: number; // writeOffLoss + manualExpenses + payrollExpense

  netProfit: number; // grossProfit - totalExpenses
}
