import type { NextAuthConfig } from "next-auth";
import { PAGES } from "./pages.config";

type MembershipSnapshot = {
  organizationId: string;
  role: string;
  pointId: string | null;
  workScheduleId: string | null;
};

type IsEmailVerifiedUser = { isEmailVerified?: boolean };

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
      // 0 ta a'zolik — hali provisioning/onboarding bo'lmagan;
      // 1+ dan ko'p a'zolik, lekin faol tashkilot tanlanmagan — SaaS'dan
      // bir xil mahsulot bir necha marta olingan holat.
      const membershipCount = auth?.user?.membershipCount ?? 0;
      const needsSelection = !hasOrg && membershipCount > 1;
      // Eski userlar uchun true (default) — faqat yangi ro'yxatdan
      // o'tganlar tasdiqlanguncha false bo'ladi.
      const emailVerified = auth?.user?.isEmailVerified ?? true;
      const path = nextUrl.pathname;

      const isPublic =
        path.startsWith(PAGES.LOGIN) ||
        path.startsWith(PAGES.REGISTER) ||
        path.startsWith(PAGES.FORGOT_PASSWORD) ||
        path.startsWith(PAGES.RESET_PASSWORD) ||
        path.startsWith(PAGES.SUBSCRIPTION_EXPIRED);
      const isVerifyEmail = path.startsWith(PAGES.VERIFY_EMAIL);
      const isOnboarding = path.startsWith(PAGES.ONBOARDING);
      const isSelectOrg = path.startsWith(PAGES.SELECT_ORGANIZATION);

      if (!isLoggedIn && !isPublic && !isVerifyEmail) return false; // → redirects to signIn page

      // Ro'yxatdan o'tgan, lekin emailini hali tasdiqlamagan user —
      // tasdiqlash sahifasidan boshqa hech qayerga o'tolmaydi (va bu yerda
      // to'xtaymiz, aks holda pastdagi "tashkilot yo'q → onboarding"
      // qoidasi bilan to'qnashib, cheksiz redirect hosil bo'ladi).
      if (isLoggedIn && !emailVerified) {
        return isVerifyEmail
          ? true
          : Response.redirect(new URL(PAGES.VERIFY_EMAIL, nextUrl));
      }

      if (isLoggedIn && isVerifyEmail) {
        const target = hasOrg
          ? PAGES.HOME
          : needsSelection
            ? PAGES.SELECT_ORGANIZATION
            : PAGES.ONBOARDING;
        return Response.redirect(new URL(target, nextUrl));
      }

      if (isLoggedIn && isPublic) {
        const target = hasOrg
          ? PAGES.HOME
          : needsSelection
            ? PAGES.SELECT_ORGANIZATION
            : PAGES.ONBOARDING;
        return Response.redirect(new URL(target, nextUrl));
      }

      if (isLoggedIn && !hasOrg && needsSelection && !isSelectOrg) {
        return Response.redirect(new URL(PAGES.SELECT_ORGANIZATION, nextUrl));
      }

      if (isLoggedIn && !hasOrg && !needsSelection && !isOnboarding) {
        return Response.redirect(new URL(PAGES.ONBOARDING, nextUrl));
      }

      if (isLoggedIn && hasOrg && (isOnboarding || isSelectOrg)) {
        return Response.redirect(new URL(PAGES.HOME, nextUrl));
      }

      return true;
    },

    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;

        const memberships =
          (user as { memberships?: MembershipSnapshot[] }).memberships ?? [];

        token.membershipCount = memberships.length;
        token.organizationId =
          memberships.length === 1 ? memberships[0].organizationId : null;
        token.isEmailVerified =
          (user as IsEmailVerifiedUser).isEmailVerified ?? true;
      }

      if (trigger === "update" && token.id) {
        token.isEmailVerified =
          session?.isEmailVerified ?? token.isEmailVerified;
      }

      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.organizationId =
        (token.organizationId as string | null) ?? null;
      session.user.membershipCount = (token.membershipCount as number) ?? 0;
      session.user.isEmailVerified =
        (token.isEmailVerified as boolean) ?? true;
      return session;
    },
  },
};
