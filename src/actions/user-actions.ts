"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission, hasPermission } from "@/lib/permissions";
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
import { PAGES } from "@/config/pages.config";

export async function getProfile() {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organization: { select: { id: true, name: true, logo: true } },
    },
  });
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

  const users = await prisma.user.findMany({
    where: { organizationId: session.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      pointId: true,
      point: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return users.map((u: (typeof users)[number]) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    createdAt: u.createdAt,
    pointId: u.pointId,
    pointName: u.point?.name ?? null,
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

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashed,
        role,
        pointId: pointId ?? null,
        organizationId: session.organizationId,
      },
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

    const target = await prisma.user.findFirst({
      where: { id: userId, organizationId: session.organizationId },
    });
    if (!target) return { success: false, error: "Пользователь не найден." };

    await prisma.user.update({ where: { id: userId }, data: { role } });

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

    const target = await prisma.user.findFirst({
      where: { id: userId, organizationId: session.organizationId },
    });
    if (!target) return { success: false, error: "Пользователь не найден." };

    if (pointId) {
      const point = await prisma.point.findFirst({
        where: { id: pointId, organizationId: session.organizationId },
      });
      if (!point) return { success: false, error: "Nuqta topilmadi" };
    }

    await prisma.user.update({ where: { id: userId }, data: { pointId } });

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

    const target = await prisma.user.findFirst({
      where: { id: userId, organizationId: session.organizationId },
    });
    if (!target) return { success: false, error: "Пользователь не найден." };

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath(PAGES.USERS);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteOrgUser]", err);
    return { success: false, error: "Не удалось удалить пользователя." };
  }
}
