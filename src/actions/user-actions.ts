"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession, getAuthUser } from "@/lib/auth";
import { checkPermission, hasPermission } from "@/lib/permissions";
import { findOrgUser } from "@/lib/membership";
import {
  CreateUserSchema,
  UpdateUserRoleSchema,
  UpdateUserPointSchema,
  type CreateUserInput,
  type UpdateUserRoleInput,
  type UpdateUserPointInput,
} from "@/schema/user.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { IOrgUser } from "@/types/user.types";
import type { Role } from "@/types/role.types";
import type { TxClient } from "@/types/prisma.types";
import { PAGES } from "@/config/pages.config";
import { isLocale, type TLocale } from "@/config/locales.config";

export async function getProfile() {
  const session = await getServerSession();

  if (!session) {
    const authUser = await getAuthUser();
    redirect(authUser ? PAGES.ONBOARDING : PAGES.LOGIN);
  }

  const [user, organization] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, locale: true },
    }),
    prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { id: true, name: true, logo: true },
    }),
  ]);

  // role — User'da emas, joriy tashkilot bo'yicha OrganizationMember'da;
  // getServerSession() buni allaqachon faol a'zolikdan o'qib bergan.
  return { ...user, role: session.role, organization };
}

export async function updateProfile(input: {
  name: string;
  email: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name) return { success: false, error: "Необходимо указать имя." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Неверный адрес электронной почты." };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.userId) {
      return { success: false, error: "Этот адрес электронной почты уже используется." };
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name, email },
    });

    revalidatePath(PAGES.PROFILE);

    return { success: true, data: { id: user.id } };
  } catch (err) {
    console.error("[updateProfile]", err);
    return { success: false, error: "Не удалось обновить профиль." };
  }
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const { currentPassword, newPassword } = input;

    if (newPassword.length < 8) {
      return { success: false, error: "Новый пароль должен содержать не менее 8 символов." };
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { password: true },
    });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Текущий пароль неверный." };
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashed },
    });

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[changePassword]", err);
    return { success: false, error: "Не удалось обновить пароль." };
  }
}
// ─── Users management (users:manage) ───────────────────────────────────────────

export async function getOrgUsers(): Promise<IOrgUser[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");
  if (!hasPermission(session.role, "users:manage")) return [];

  const memberships = await prisma.organizationMember.findMany({
    where: { organizationId: session.organizationId },
    select: {
      role: true,
      pointId: true,
      workScheduleId: true,
      point: { select: { name: true } },
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((m: { role: string; pointId: string | null; workScheduleId: string | null; point: { name: string } | null; user: { id: string; name: string; email: string; createdAt: Date } }) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role as Role,
    createdAt: m.user.createdAt,
    pointId: m.pointId,
    pointName: m.point?.name ?? null,
    workScheduleId: m.workScheduleId,
    salaryType: null,
    rate: null,
    effectiveFrom: null,
  }));
}

export async function createUser(
  input: CreateUserInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "users:manage");
    if (denied) return denied;

    const parsed = CreateUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { name, email, password, role, pointId } = parsed.data;

    if (role === "OWNER" && session.role !== "OWNER") {
      return { success: false, error: "Только владелец может создать нового владельца." };
    }

    if (pointId) {
      const point = await prisma.point.findFirst({
        where: { id: pointId, organizationId: session.organizationId },
      });
      if (!point) return { success: false, error: "Nuqta topilmadi" };
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) return { success: false, error: "Этот адрес электронной почты уже используется." };

    const hashed = await bcrypt.hash(password, 12);

    // User (identity) va OrganizationMember (shu tashkilotdagi rol/nuqta)
    // birga, bitta tranzaksiyada yaratiladi.
    const user = await prisma.$transaction(async (tx: TxClient) => {
      const created = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashed,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: created.id,
          organizationId: session.organizationId,
          role,
          pointId: pointId ?? null,
        },
      });

      return created;
    });

    revalidatePath(PAGES.USERS);

    return { success: true, data: { id: user.id } };
  } catch (err) {
    console.error("[createUser]", err);
    return { success: false, error: "Не удалось создать пользователя." };
  }
}

export async function updateUserRole(
  input: UpdateUserRoleInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "users:manage");
    if (denied) return denied;

    const parsed = UpdateUserRoleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { userId, role } = parsed.data;

    if (role === "OWNER" && session.role !== "OWNER") {
      return { success: false, error: "Только владелец может назначить роль владельца." };
    }
    if (userId === session.userId) {
      return { success: false, error: "Вы не можете изменить свою роль." };
    }

    const target = await findOrgUser(userId, session.organizationId);
    if (!target) return { success: false, error: "Пользователь не найден." };

    await prisma.organizationMember.update({
      where: {
        userId_organizationId: { userId, organizationId: session.organizationId },
      },
      data: { role },
    });

    revalidatePath("/users");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateUserRole]", err);
    return { success: false, error: "Не удалось обновить роль." };
  }
}

export async function updateUserPoint(
  input: UpdateUserPointInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "users:manage");
    if (denied) return denied;

    const parsed = UpdateUserPointSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { userId, pointId } = parsed.data;

    const target = await findOrgUser(userId, session.organizationId);
    if (!target) return { success: false, error: "Пользователь не найден." };

    if (pointId) {
      const point = await prisma.point.findFirst({
        where: { id: pointId, organizationId: session.organizationId },
      });
      if (!point) return { success: false, error: "Nuqta topilmadi" };
    }

    await prisma.organizationMember.update({
      where: {
        userId_organizationId: { userId, organizationId: session.organizationId },
      },
      data: { pointId },
    });

    revalidatePath("/users");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateUserPoint]", err);
    return { success: false, error: "Nuqtani yangilab bo'lmadi" };
  }
}

export async function deleteOrgUser(
  userId: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "users:manage");
    if (denied) return denied;

    if (userId === session.userId) {
      return { success: false, error: "Вы не можете удалить себя." };
    }

    const target = await findOrgUser(userId, session.organizationId);
    if (!target) return { success: false, error: "Пользователь не найден." };

    // MUHIM: endi bu userni global o'chirmaydi — faqat shu tashkilotdan
    // chiqaradi (OrganizationMember o'chiriladi). Chunki bitta User
    // bir nechta tashkilotga a'zo bo'lishi mumkin, va tarixiy yozuvlar
    // (Sale, Timesheet va h.k.) userId'ga bog'liq — ular saqlanib qoladi.
    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: { userId, organizationId: session.organizationId },
      },
    });

    revalidatePath(PAGES.USERS);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteOrgUser]", err);
    return { success: false, error: "Не удалось удалить пользователя." };
  }
}

export async function updateUserSchedule({
  userId,
  workScheduleId,
}: {
  userId: string;
  workScheduleId: string | null;
}): Promise<ActionResult> {
  try {
    const session = await getServerSession();

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const denied = checkPermission(session.role, "users:manage");
    if (denied) return denied;

    const target = await findOrgUser(userId, session.organizationId);

    if (!target) {
      return {
        success: false,
        error: "Пользователь не найден.",
      };
    }

    const membershipWhere = {
      userId_organizationId: { userId, organizationId: session.organizationId },
    } as const;

    // Grafikni olib tashlash
    if (workScheduleId === null) {
      await prisma.organizationMember.update({
        where: membershipWhere,
        data: { workScheduleId: null },
      });

      revalidatePath(PAGES.USERS);

      return {
        success: true,
        data: undefined,
      };
    }

    const schedule = await prisma.workSchedule.findFirst({
      where: {
        id: workScheduleId,
        organizationId: session.organizationId,
      },
    });

    if (!schedule) {
      return {
        success: false,
        error: "График не найден.",
      };
    }

    await prisma.organizationMember.update({
      where: membershipWhere,
      data: { workScheduleId },
    });

    revalidatePath(PAGES.USERS);

    return {
      success: true,
      data: undefined,
    };
  } catch (err) {
    console.error("[updateUserSchedule]", err);

    return {
      success: false,
      error: "Не удалось изменить график пользователя.",
    };
  }
}

export async function updateLocale(
  locale: TLocale
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    if (!isLocale(locale)) {
      return {
        success: false,
        error: "Неправильный язык.",
      };
    }

    await prisma.user.update({
      where: {
        id: session.userId,
      },
      data: {
        locale,
      },
    });

    revalidatePath(PAGES.PROFILE);

    return {
      success: true,
      data: undefined,
    };
  } catch (err) {
    console.error("[updateLocale]", err);

    return {
      success: false,
      error: "Язык не удалось обновить.",
    };
  }
}