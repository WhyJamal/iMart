import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyIntegrationToken } from "@/lib/integration";
import { PAGES } from "@/config/pages.config";

/**
 * narsil'dagi "Kirish" tugmasi shu yerga yo'naltiradi:
 *   /api/integrations/sso?token=...
 * Token ichida vol-mart-next userId VA organizationId bor (narsil
 * "Kirish" tugmasi allaqachon aniq Project → aniq Organization'ni
 * bilgani uchun). Bitta odam bir nechta tashkilotga a'zo bo'lishi
 * mumkin bo'lgani uchun organizationId shart — aks holda qaysi
 * tashkilotga kirishni bilib bo'lmaydi.
 *
 * Muvaffaqiyatli bo'lsa — NextAuth sessiya cookie'sini qo'lda o'rnatib,
 * boshqaruv paneliga yo'naltiradi (parol so'ramasdan).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL(PAGES.LOGIN, req.url));
  }

  const payload = verifyIntegrationToken<{
    userId: string;
    organizationId?: string;
  }>(token);
  if (!payload?.userId) {
    return NextResponse.redirect(new URL(PAGES.LOGIN, req.url));
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    return NextResponse.redirect(new URL(PAGES.LOGIN, req.url));
  }

  // organizationId token orqali kelmagan bo'lsa (eski narsil deploy'i
  // hali yangilanmagan bo'lishi mumkin) — foydalanuvchining yagona
  // a'zoligiga tushamiz; agar bir nechta bo'lsa, aniq tanlov kerak
  // bo'lgani uchun login sahifasiga yo'naltiramiz (u yerdan keyin
  // /select-organization'ga o'tadi).
  let organizationId = payload.organizationId ?? null;
  if (!organizationId) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    if (memberships.length === 1) {
      organizationId = memberships[0].organizationId;
    } else {
      return NextResponse.redirect(new URL(PAGES.LOGIN, req.url));
    }
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    include: { organization: true },
  });

  if (!membership) {
    return NextResponse.redirect(new URL(PAGES.LOGIN, req.url));
  }

  if (
    membership.organization.subscriptionExpiresAt &&
    membership.organization.subscriptionExpiresAt < new Date()
  ) {
    return NextResponse.redirect(new URL(PAGES.SUBSCRIPTION_EXPIRED, req.url));
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "AUTH_SECRET yo'q" }, { status: 500 });
  }

  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const sessionJwt = await encode({
    token: {
      id: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
      pointId: membership.pointId,
      workScheduleId: membership.workScheduleId,
      locale: user.locale,
    },
    secret,
    salt: cookieName,
  });

  const response = NextResponse.redirect(new URL(PAGES.HOME, req.url));
  response.cookies.set(cookieName, sessionJwt, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
