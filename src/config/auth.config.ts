import type { NextAuthConfig } from "next-auth";
import { PAGES } from "./pages.config";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },

  pages: {
    signIn: PAGES.LOGIN,
    error: PAGES.LOGIN,
  },

  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const hasOrg = !!auth?.user?.organizationId;
      const path = nextUrl.pathname;

      const isPublic =
        path.startsWith(PAGES.LOGIN) || path.startsWith(PAGES.REGISTER);
      const isOnboarding = path.startsWith(PAGES.ONBOARDING);

      if (!isLoggedIn && !isPublic) return false; // → redirects to signIn page
      if (isLoggedIn && isPublic) {
        return Response.redirect(
          new URL(hasOrg ? PAGES.HOME : PAGES.ONBOARDING, nextUrl)
        );
      }
      if (isLoggedIn && !hasOrg && !isOnboarding) {
        return Response.redirect(new URL(PAGES.ONBOARDING, nextUrl));
      }
      if (isLoggedIn && hasOrg && isOnboarding) {
        return Response.redirect(new URL(PAGES.HOME, nextUrl));
      }

      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId =
          (user as typeof user & { organizationId?: string | null })
            .organizationId ?? null;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.organizationId =
        (token.organizationId as string | null) ?? null;
      return session;
    },
  },
};