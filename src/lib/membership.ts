import { prisma } from "@/lib/prisma";

export type OrgScopedUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
  pointId: string | null;
  workScheduleId: string | null;
};

/**
 * Berilgan tashkilotdagi (ixtiyoriy ravishda ma'lum Point'ga
 * biriktirilgan) foydalanuvchilar ro'yxati. role/pointId/workScheduleId
 * endi User'da emas, OrganizationMember'da — shu funksiya orqali
 * eski "prisma.user.findMany({ where: { organizationId } })" o'rnini
 * bosadi.
 */
export async function findOrgUsers(
  organizationId: string,
  filter?: { pointId?: string; isActive?: boolean }
): Promise<OrgScopedUser[]> {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      ...(filter?.pointId ? { pointId: filter.pointId } : {}),
      ...(filter?.isActive !== undefined
        ? { user: { isActive: filter.isActive } }
        : {}),
    },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map(toOrgScopedUser);
}

/**
 * Bitta foydalanuvchining shu tashkilot ichidagi holati (rol, nuqta,
 * grafik). Eski "prisma.user.findFirst({ where: { id, organizationId } })"
 * o'rnini bosadi.
 */
export async function findOrgUser(
  userId: string,
  organizationId: string
): Promise<OrgScopedUser | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: { user: true },
  });

  if (!membership) return null;
  return toOrgScopedUser(membership);
}

function toOrgScopedUser(membership: {
  role: string;
  pointId: string | null;
  workScheduleId: string | null;
  user: { id: string; name: string; email: string; isActive: boolean };
}): OrgScopedUser {
  return {
    id: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    isActive: membership.user.isActive,
    role: membership.role,
    pointId: membership.pointId,
    workScheduleId: membership.workScheduleId,
  };
}
