import { auth } from "@/auth";
import type { Role } from "@/types/role.types";
import { scopedPrisma, type ScopedPrismaClient } from "@/lib/tenant-prisma";

export type ServerSession = {
  userId: string;
  organizationId: string;
  role: Role;
  pointId: string | null;
  workScheduleId: string | null;
  /**
   * organizationId bilan avtomatik "qulflangan" Prisma client —
   * yangi kod yozganda `prisma` o'rniga shuni ishlatish tavsiya
   * etiladi: har bir so'rovga organizationId majburiy qo'shiladi,
   * hatto yozishni unutib qo'ysangiz ham. Batafsil:
   * src/lib/tenant-prisma.ts
   */
  db: ScopedPrismaClient;
};

/**
 * Returns typed session for use inside Server Actions.
 * Returns null if unauthenticated or an active organization isn't
 * selected yet (0 memberships, or 1+ memberships awaiting selection).
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const session = await auth();

  if (!session?.user?.id) return null;
  if (!session.user.organizationId || !session.user.role) return null;

  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    role: session.user.role,
    pointId: session.user.pointId ?? null,
    workScheduleId: session.user.workScheduleId ?? null,
    db: scopedPrisma(session.user.organizationId),
  };
}

/**
 * Returns user session without requiring an active organization.
 * Used in onboarding/select-organization where org isn't set yet.
 */
export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId ?? null,
    membershipCount: session.user.membershipCount ?? 0,
  };
}