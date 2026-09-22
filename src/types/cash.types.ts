import type { CashFlow, CashRegister, BankAccount } from "@/generated/prisma/client";

export type CashDocType =
  | "SALE"
  | "PURCHASE"
  | "SALE_RETURN" // mijoz do'konga tovar qaytardi (pul chiqim)
  | "PURCHASE_RETURN" // do'kon ta'minotchiga tovar qaytardi (pul kirim)
  | "PAYROLL" // xodimga oylik/maosh to'landi (pul chiqim)
  | "DEBT_COLLECT" // mijozdan qarz undirildi (pul kirim)
  | "DEBT_PAY" // yetkazib beruvchiga qarz to'landi (pul chiqim)
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "EXPENSE"
  | "ADJUSTMENT"
  | "CASH_TRANSFER"; // nuqtalar orasida pul (profit-center) o'tkazish

export type CashDirection = "IN" | "OUT";

export type CashMethod = "CASH" | "CARD" | "QR";

export type TCashRegisterSerialized = Omit<CashRegister, "balance"> & {
  balance: number;
};

export type TCashFlowSerialized = Omit<CashFlow, "amount"> & {
  amount: number;
  /** Point (foyda markazi) nomi; null — umumiy / nuqtasiz yozuv */
  pointName: string | null;
};

/**
 * Kassa sahifasidagi filtr. pointId === CASH_NO_POINT — faqat nuqtasiz
 * (umumiy) yozuvlar; pointId berilmasa — barcha nuqtalar.
 * Sanalar YYYY-MM-DD ko'rinishida (ikkala chegara ham kiradi).
 */
export const CASH_NO_POINT = "none";

export interface ICashFilter {
  pointId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Bitta nuqta (foyda markazi) bo'yicha pul oqimi. pointId === null —
 * hech qaysi nuqtaga biriktirilmagan (umumiy xarajatlar, eski yozuvlar).
 * "net" — sof PUL oqimi (kirim − chiqim), bu buxgalteriya foydasi
 * emas: xarid/ombor xarajatlari ham chiqim sifatida kiradi. Haqiqiy
 * foyda (accrual) uchun Foyda-Zarar hisoboti ishlatiladi.
 */
export interface ICashPointSummary {
  pointId: string | null;
  pointName: string | null;
  cashIn: number;
  cashOut: number;
  bankIn: number;
  bankOut: number;
  totalIn: number;
  totalOut: number;
  net: number;
}

export type TBankAccountSerialized = Omit<BankAccount, "balance"> & {
  balance: number;
};

export type TCashRegisterWithEntries = CashRegister & {
  entries: CashFlow[];
};

export interface ICashFlow {
  id: string;
  docType: CashDocType;
  docId: string | null;
  direction: CashDirection;
  method: CashMethod;
  amount: number;
  note: string | null;
  createdAt: Date;
}

export interface ICashRegister {
  id: string;
  balance: number;
  updatedAt: Date;
}