// Loyihada SQLite ishlatilgani uchun Prisma enum emas, String + TS union
// type patterni qo'llaniladi (docType, paymentMethod kabi).

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "CASHIER";

export const ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "CASHIER"];

export type Permission =
  | "products:read"
  | "products:write"
  | "sales:create"
  | "sales:delete"
  | "purchases:create"
  | "purchases:delete"
  | "returns:create"
  | "returns:delete"
  | "cash:read"
  | "cash:write"
  | "reports:read"
  | "users:manage"
  | "payroll:read"
  | "payroll:manage"
  | "warehouses:manage"
  | "contragents:manage"
  | "calendar:manage";
