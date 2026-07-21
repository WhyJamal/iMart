import { ROLE_PERMISSIONS } from "@/config/permissions.config";
import type { Role, Permission } from "@/types/role.types";

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Server action'lar ichida chaqiriladi. ActionResult<T> patteringizga
 * mos — muvaffaqiyatsiz bo'lsa shu joyda return qilinadi:
 *
 *   const denied = checkPermission(session.role, "returns:create");
 *   if (denied) return denied;
 */
export function checkPermission(
  role: Role,
  permission: Permission
): { success: false; error: string } | null {
  if (!hasPermission(role, permission)) {
    return { success: false, error: "У вас нет прав для выполнения этого действия." };
  }
  return null;
}
