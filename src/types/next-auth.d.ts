import type { DefaultSession } from "next-auth";
import { Role } from "./role.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // Faol tashkilot tanlanmagan bo'lsa (0 yoki 1+ dan ko'p a'zolik
      // holatida tanlov qilinmaguncha) — null.
      organizationId: string | null;
      role: Role | null;
      locale: string;
      isEmailVerified: boolean;
      pointId: string | null;
      workScheduleId: string | null;
      // Foydalanuvchi nechta tashkilotga a'zoligini bildiradi —
      // routing (onboarding vs select-organization) shu asosda hal qilinadi.
      membershipCount: number;
    } & DefaultSession["user"];
  }
}
