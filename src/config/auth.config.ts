import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const hasOrg = !!auth?.user?.organizationId;
      const path = nextUrl.pathname;

      const isPublic =
        path.startsWith("/login") || path.startsWith("/register");
      const isOnboarding = path.startsWith("/onboarding");

      if (!isLoggedIn && !isPublic) return false; // → redirects to signIn page
      if (isLoggedIn && isPublic) {
        return Response.redirect(
          new URL(hasOrg ? "/dashboard" : "/onboarding", nextUrl)
        );
      }
      if (isLoggedIn && !hasOrg && !isOnboarding) {
        return Response.redirect(new URL("/onboarding", nextUrl));
      }
      if (isLoggedIn && hasOrg && isOnboarding) {
        return Response.redirect(new URL("/dashboard", nextUrl));
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