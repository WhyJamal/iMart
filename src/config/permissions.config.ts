import type { Role, Permission } from "@/types/role.types";

/**
 * Har bir rol nima qila olishi — MARKAZIY ro'yxat.
 * Yangi ruxsat kerak bo'lsa: Permission type'ga qo'shing, shu yerga
 * tarqating. Kodning boshqa hech qayerida rolni qo'lda solishtirmang
 * (`role === "ADMIN"` kabi) — doim hasPermission() orqali tekshiring.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "products:read", "products:write",
    "sales:create", "sales:delete",
    "purchases:create", "purchases:delete",
    "returns:create", "returns:delete",
    "writeoffs:create", "writeoffs:delete",
    "cash:read", "cash:write",
    "reports:read",
    "users:manage",
    "payroll:read", "payroll:manage",
    "warehouses:manage",
    "contragents:manage",
    "calendar:manage",
    "schedules:manage",
    "timesheets:read",
    "promotions:manage",
    "transfers:create", "transfers:delete",
  ],
  ADMIN: [
    "products:read", "products:write",
    "sales:create", "sales:delete",
    "purchases:create", "purchases:delete",
    "returns:create", "returns:delete",
    "writeoffs:create", "writeoffs:delete",
    "cash:read", "cash:write",
    "reports:read",
    "payroll:read", "payroll:manage",
    "warehouses:manage",
    "contragents:manage",
    "calendar:manage",
    "schedules:manage",
    "timesheets:read",
    "promotions:manage",
    "transfers:create", "transfers:delete",
  ],
  MANAGER: [
    "products:read", "products:write",
    "sales:create",
    "purchases:create",
    "returns:create",
    "writeoffs:create",
    "cash:read",
    "reports:read",
    "promotions:manage",
    "transfers:create",
  ],
  CASHIER: [
    "products:read",
    "sales:create",
    "returns:create",
  ],
};

