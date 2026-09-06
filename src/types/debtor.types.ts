export interface IDebtor {
  id: string;
  name: string;
  phone: string | null;
  createdAt: Date;
}

// POS'dagi "Qarz" combobox uchun — nomi + joriy qarzi bilan
export interface IDebtorOption {
  id: string;
  name: string;
  phone: string | null;
  debt: number;
}

export interface IDebtorPayment {
  id: string;
  debtorId: string;
  amount: number;
  method: string;
  note: string | null;
  createdAt: Date;
}

// Kontragentlar (yetkazib beruvchilar) ro'yxatida qo'shimcha ko'rsatiladigan
// joriy qarz — Purchase.paidAmount va SupplierPayment asosida hisoblanadi
export interface ISupplierPayment {
  id: string;
  contragentId: string;
  amount: number;
  method: string;
  note: string | null;
  createdAt: Date;
}
