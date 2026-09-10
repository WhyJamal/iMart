import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyIntegrationToken } from "@/lib/integration";
import { PAGES } from "@/config/pages.config";

/**
 * narsil'dagi "Kirish" tugmasi shu yerga yo'naltiradi:
 *   /api/integrations/sso?token=...
 * Token ichida faqat vol-mart-next userId bor (signIntegrationToken
 * narsil tomonida emas, shu loyihaning o'zida provision javobidan
 * kelgan userId bilan narsil tomonidan chaqiriladi — token shu yerda
 * emas, narsil'da ham xuddi shu INTEGRATION_SECRET bilan imzolanadi).
 *
 * Muvaffaqiyatli bo'lsa — NextAuth sessiya cookie'sini qo'lda o'rnatib,
 * boshqaruv paneliga yo'naltiradi (parol so'ramasdan).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL(PAGES.LOGIN, req.url));
  }

  const payload = verifyIntegrationToken<{ userId: string }>(token);
  if (!payload?.userId) {
    return NextResponse.redirect(new URL(PAGES.LOGIN, req.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { organization: true },
  });

  if (!user || !user.organizationId) {
    return NextResponse.redirect(new URL(PAGES.LOGIN, req.url));
  }

  if (
    user.organization?.subscriptionExpiresAt &&
    user.organization.subscriptionExpiresAt < new Date()
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
      organizationId: user.organizationId,
      role: user.role,
      pointId: user.pointId,
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
