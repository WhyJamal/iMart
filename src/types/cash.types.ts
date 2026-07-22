import type { CashFlow, CashRegister, BankAccount } from "@/generated/prisma/client";

export type CashDocType =
  | "SALE"
  | "PURCHASE"
  | "SALE_RETURN" // mijoz do'konga tovar qaytardi (pul chiqim)
  | "PURCHASE_RETURN" // do'kon ta'minotchiga tovar qaytardi (pul kirim)
  | "PAYROLL" // xodimga oylik/maosh to'landi (pul chiqim)
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "EXPENSE"
  | "ADJUSTMENT";

export type CashDirection = "IN" | "OUT";

export type CashMethod = "CASH" | "CARD" | "QR";

export type TCashRegisterSerialized = Omit<CashRegister, "balance"> & {
  balance: number;
};

export type TCashFlowSerialized = Omit<CashFlow, "amount"> & {
  amount: number;
};

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