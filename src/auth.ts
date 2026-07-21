import NextAuth from "next-auth";
import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./config/auth.config";

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
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.organizationId =
          (user as typeof user & { organizationId?: string | null })
            .organizationId ?? null;
        token.role =
          (user as typeof user & { role?: string }).role ?? "CASHIER";
      }

      if (trigger === "update" || (token.id && !token.organizationId)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { organizationId: true, role: true },
        });
        token.organizationId = fresh?.organizationId ?? null;
        token.role = fresh?.role ?? "CASHIER";
      }

      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.organizationId =
        (token.organizationId as string | null) ?? null;
      session.user.role = (token.role as Session["user"]["role"]) ?? "CASHIER";
      return session;
    },
  },
});