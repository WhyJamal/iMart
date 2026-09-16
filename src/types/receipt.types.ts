export const TOTAL_ALIGNS = ["left", "center", "right"] as const;
export type TotalAlign = (typeof TOTAL_ALIGNS)[number];

export interface IReceiptTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  showProductName: boolean;
  showQty: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showLineTotal: boolean;
  totalAlign: TotalAlign;
  headerText: string | null;
  footerText: string | null;
}

export interface IReceiptItem {
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

// IReceiptData — chek komponentini chizish uchun kerak bo'lgan
// HAMMA narsa: sotuv ma'lumotlari + o'sha tashkilotning joriy
// (default) shabloni. POS'da ham, Sales sahifasida ham AYNAN shu bir
// xil tipdagi ma'lumot bilan bitta <Receipt /> komponenti ishlatiladi.
export interface IReceiptData {
  saleNumber: string;
  createdAt: string;
  organizationName: string;
  pointName: string | null;
  cashierName: string | null;
  paymentMethod: string;
  items: IReceiptItem[];
  subtotal: number;
  totalAmount: number;
  template: IReceiptTemplate;
}
