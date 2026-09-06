export type ContragentType = "SUPPLIER" | "BUYER";

export interface IContragent {
  id: string;
  name: string;
  phone: string | null;
  inn: string | null;
  type: ContragentType;
  purchaseCount: number;
  debt: number; // faqat SUPPLIER uchun mazmunli — biz unga qancha qarzmiz
  createdAt: Date;
}

export interface IContragentOption {
  id: string;
  name: string;
  type: ContragentType;
}
