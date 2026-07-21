"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result.types";

export async function getProfile() {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
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

    if (!name) return { success: false, error: "Ism kiritilishi shart" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Email noto'g'ri kiritildi" };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.userId) {
      return { success: false, error: "Bu email allaqachon band" };
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name, email },
    });

    revalidatePath("/profile");

    return { success: true, data: { id: user.id } };
  } catch (err) {
    console.error("[updateProfile]", err);
    return { success: false, error: "Profilni yangilab bo'lmadi" };
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
      return { success: false, error: "Yangi parol kamida 8 belgidan iborat bo'lishi kerak" };
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { password: true },
    });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Joriy parol noto'g'ri" };
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashed },
    });

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[changePassword]", err);
    return { success: false, error: "Parolni yangilab bo'lmadi" };
  }
}