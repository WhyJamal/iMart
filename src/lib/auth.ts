import { auth } from "@/auth";

export type ServerSession = {
  userId: string;
  organizationId: string;
};

/**
 * Returns typed session for use inside Server Actions.
 * Returns null if unauthenticated or org not set up yet.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const session = await auth();

  if (!session?.user?.id) return null;
  if (!session.user.organizationId) return null;

  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
  };
}

/**
 * Returns user session without requiring organizationId.
 * Used in onboarding where org doesn't exist yet.
 */
export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId ?? null,
  };
}