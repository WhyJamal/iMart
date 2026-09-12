import NextAuth from "next-auth";
import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./config/auth.config";

type MembershipSnapshot = {
  organizationId: string;
  role: string;
  pointId: string | null;
  workScheduleId: string | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            memberships: {
              select: {
                organizationId: true,
                role: true,
                pointId: true,
                workScheduleId: true,
              },
              orderBy: { joinedAt: "asc" },
            },
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        // Bitta email — bir nechta tashkilotga a'zo bo'lishi mumkin
        // (masalan narsil'dan bir xil mahsulot bir necha marta sotib
        // olingan bo'lsa). Qaysi tashkilot bilan kirishni jwt callback
        // hal qiladi: 1 ta bo'lsa avtomatik, ko'p bo'lsa /select-organization.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          locale: user.locale,
          isEmailVerified: user.emailVerified,
          memberships: user.memberships as MembershipSnapshot[],
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.locale = (user as { locale?: string }).locale ?? "ru";
        token.isEmailVerified =
          (user as { isEmailVerified?: boolean }).isEmailVerified ?? true;

        const initialMemberships =
          (user as { memberships?: MembershipSnapshot[] }).memberships ?? [];

        token.membershipCount = initialMemberships.length;

        if (initialMemberships.length === 1) {
          applyMembership(token, initialMemberships[0]);
        } else {
          // 0 ta (hali provisioning bo'lmagan) yoki bir nechta (tanlov
          // kerak) — ikkala holatda ham faol tashkilot yo'q holatda
          // qoldiramiz, sahifalar buni PAGES.ONBOARDING /
          // PAGES.SELECT_ORGANIZATION orqali hal qiladi.
          clearMembership(token);
        }

        return token;
      }

      if (
        trigger === "update" &&
        typeof session?.isEmailVerified === "boolean"
      ) {
        // /verify-email kod tasdiqlangandan keyin sessionni yangilash uchun
        // chaqiriladi (update({ isEmailVerified: true })).
        token.isEmailVerified = session.isEmailVerified;
        return token;
      }

      if (trigger === "update" && session?.organizationId) {
        // "Kirish" (SSO) yoki select-organization sahifasi orqali
        // foydalanuvchi aniq bir tashkilotni tanlaganda shu yerga keladi.
        const membership = await prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: token.id as string,
              organizationId: session.organizationId as string,
            },
          },
        });

        if (membership) {
          applyMembership(token, membership);
        }

        return token;
      }

      if (trigger === "update" && token.id) {
        // Umumiy "yangila" (masalan yangi xarid qilingandan keyin, yoki
        // admin rol/nuqtani o'zgartirgandan keyin) — a'zoliklarni qayta
        // o'qiymiz.
        const memberships = await prisma.organizationMember.findMany({
          where: { userId: token.id as string },
          select: {
            organizationId: true,
            role: true,
            pointId: true,
            workScheduleId: true,
          },
          orderBy: { joinedAt: "asc" },
        });

        token.membershipCount = memberships.length;

        if (memberships.length === 1) {
          applyMembership(token, memberships[0]);
        } else if (memberships.length === 0) {
          clearMembership(token);
        } else if (token.organizationId) {
          // memberships.length > 1: joriy tanlangan tashkilot uchun
          // rol/nuqta admin tomonidan o'zgargan bo'lishi mumkin —
          // shu tashkilotning eng so'nggi holatini qayta o'qiymiz.
          const active = memberships.find(
            (m: { organizationId: string }) => m.organizationId === token.organizationId
          );
          if (active) {
            applyMembership(token, active);
          } else {
            clearMembership(token);
          }
        }
      }

      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.organizationId =
        (token.organizationId as string | null) ?? null;
      session.user.role = (token.role as Session["user"]["role"]) ?? null;
      session.user.locale = (token.locale as string) ?? "ru";
      session.user.pointId = (token.pointId as string | null) ?? null;
      session.user.workScheduleId =
        (token.workScheduleId as string | null) ?? null;
      session.user.membershipCount = (token.membershipCount as number) ?? 0;
      session.user.isEmailVerified =
        (token.isEmailVerified as boolean) ?? true;
      return session;
    },
  },
});

function applyMembership(
  token: Record<string, unknown>,
  membership: MembershipSnapshot
) {
  token.organizationId = membership.organizationId;
  token.role = membership.role;
  token.pointId = membership.pointId ?? null;
  token.workScheduleId = membership.workScheduleId ?? null;
}

function clearMembership(token: Record<string, unknown>) {
  token.organizationId = null;
  token.role = null;
  token.pointId = null;
  token.workScheduleId = null;
}