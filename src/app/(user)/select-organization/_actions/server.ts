"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export type SelectableOrganization = {
  organizationId: string;
  name: string;
  logo: string | null;
  role: string;
};

/**
 * select-organization sahifasi uchun — joriy foydalanuvchining barcha
 * a'zoliklarini (tashkilot nomi bilan birga) qaytaradi. organizationId
 * hali sessiyada tanlanmagan bo'lishi mumkin, shuning uchun bu yerda
 * faqat userId kerak (getAuthUser organizationId'siz ham ishlaydi).
 */
export async function listMyOrganizations(): Promise<SelectableOrganization[]> {
  const authUser = await getAuthUser();
  if (!authUser) return [];

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: authUser.userId },
    orderBy: { joinedAt: "asc" },
    select: {
      organizationId: true,
      role: true,
      organization: { select: { name: true, logo: true } },
    },
  });

  return memberships.map((m) => ({
    organizationId: m.organizationId,
    name: m.organization.name,
    logo: m.organization.logo,
    role: m.role,
  }));
}
