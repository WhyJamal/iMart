// AuditLog uchun String + TS union pattern (loyihadagi boshqa modellar
// kabi, masalan Role/NotificationType). Yangi entityType kerak bo'lsa —
// shu yerga qo'shing va logAudit() chaqirilgan joyda ishlating, bazaga
// migratsiya kerak emas (oddiy String ustun).

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export type AuditEntityType =
  | "Sale"
  | "Purchase"
  | "StockIntake"
  | "Transfer"
  | "WriteOff"
  | "PurchaseReturn"
  | "SaleReturn"
  | "Promotion"
  | "Debtor"
  | "DebtorPayment"
  | "SupplierPayment"
  | "Contragent"
  | "Point"
  | "Warehouse"
  | "Product"
  | "User"
  | "Organization"
  | "CashFlow"
  | "PayrollAccrual"
  | "PayrollPayment"
  | "Timesheet";

export const AUDIT_ACTIONS: AuditAction[] = ["CREATE", "UPDATE", "DELETE"];

export const AUDIT_ENTITY_TYPES: AuditEntityType[] = [
  "Sale",
  "Purchase",
  "StockIntake",
  "Transfer",
  "WriteOff",
  "PurchaseReturn",
  "SaleReturn",
  "Promotion",
  "Debtor",
  "DebtorPayment",
  "SupplierPayment",
  "Contragent",
  "Point",
  "Warehouse",
  "Product",
  "User",
  "Organization",
  "CashFlow",
  "PayrollAccrual",
  "PayrollPayment",
  "Timesheet",
];

export interface IAuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  summary: string;
  createdAt: string;
}

export interface IAuditLogFilters {
  userId?: string;
  entityType?: AuditEntityType;
  action?: AuditAction;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}
