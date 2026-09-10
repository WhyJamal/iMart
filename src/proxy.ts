import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./config/auth.config";
import { prisma } from "@/lib/prisma";
import { PAGES } from "@/config/pages.config";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  if (
    session?.user?.organizationId &&
    !path.startsWith(PAGES.SUBSCRIPTION_EXPIRED) &&
    !path.startsWith("/api/integrations")
  ) {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { subscriptionExpiresAt: true },
    });

    if (org?.subscriptionExpiresAt && org.subscriptionExpiresAt < new Date()) {
      return NextResponse.redirect(new URL(PAGES.SUBSCRIPTION_EXPIRED, req.url));
    }
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};