"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  SetSalaryRateSchema,
  type SetSalaryRateInput,
} from "@/schema/payroll.schema";
import type { ActionResult } from "@/types/action-result.types";
import type {
  ICurrentSalary,
  ISalaryRegisterEntry,
  SalaryType,
} from "@/types/salary.types";
import { IOrgUser } from "@/types/user.types";
import type { Role } from "@/types/role.types";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Xodimning HOZIRGI maoshi — SalaryRegister'dagi eng oxirgi
 * (effectiveFrom bo'yicha) yozuvdan hisoblanadi. User modelida
 * bunday statik maydon yo'q (InventoryRegister patterni bilan bir xil).
 */
export async function getCurrentSalary(
  userId: string
): Promise<ICurrentSalary | null> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const entry = await prisma.salaryRegister.findFirst({
    where: { organizationId: session.organizationId, userId },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!entry) return null;

  return {
    salaryType: entry.salaryType as SalaryType,
    rate: Number(entry.rate),
    effectiveFrom: entry.effectiveFrom,
  };
}

export async function getSalaryHistory(
  userId: string
): Promise<ISalaryRegisterEntry[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const entries = await prisma.salaryRegister.findMany({
    where: { organizationId: session.organizationId, userId },
    orderBy: { effectiveFrom: "desc" },
  });

  return entries.map((e: (typeof entries)[number]) => ({
    id: e.id,
    salaryType: e.salaryType as SalaryType,
    rate: Number(e.rate),
    effectiveFrom: e.effectiveFrom,
    reason: e.reason,
    createdAt: e.createdAt,
  }));
}

/**
 * Tashkilotdagi barcha xodimlar + har birining HOZIRGI stavkasi
 * (agar belgilangan bo'lsa). Salary sahifasidagi asosiy jadval uchun.
 */
export async function getEmployeeSalaries(): Promise<IOrgUser[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const users = await prisma.user.findMany({
    where: { organizationId: session.organizationId },
    include: { point: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const latestEntries = await prisma.salaryRegister.findMany({
    where: {
      organizationId: session.organizationId,
      userId: { in: users.map((u: (typeof users)[number]) => u.id) },
    },
    orderBy: { effectiveFrom: "desc" },
  });

  // Har bir userId uchun eng oxirgi yozuvni olamiz
  // (entries allaqachon effectiveFrom desc bo'yicha saralangan,
  // shuning uchun birinchi uchraganini olish yetarli)
  const latestByUser = new Map<string, (typeof latestEntries)[number]>();
  for (const entry of latestEntries) {
    if (!latestByUser.has(entry.userId)) {
      latestByUser.set(entry.userId, entry);
    }
  }

  return users.map((u: (typeof users)[number]) => {
    const latest = latestByUser.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as Role,
      createdAt: u.createdAt,
      pointId: u.point?.id ?? null,
      pointName: u.point?.name ?? null,
      salaryType: latest ? (latest.salaryType as SalaryType) : null,
      rate: latest ? Number(latest.rate) : null,
      effectiveFrom: latest ? latest.effectiveFrom : null,
    };
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Xodimga yangi stavka belgilaydi (SalaryRegister'ga yozuv qo'shadi).
 * Eski yozuvlar o'chirilmaydi/o'zgartirilmaydi — bu append-only ledger.
 */
export async function setSalaryRate(
  input: SetSalaryRateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "payroll:manage");
    if (denied) return denied;

    const parsed = SetSalaryRateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { userId, salaryType, rate, effectiveFrom, reason } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: session.organizationId },
    });
    if (!user) return { success: false, error: "Foydalanuvchi topilmadi" };

    const entry = await prisma.salaryRegister.create({
      data: {
        organizationId: session.organizationId,
        userId,
        salaryType,
        rate,
        effectiveFrom,
        reason: reason ?? null,
        createdBy: session.userId,
      },
    });

    revalidatePath("/salary");
    revalidatePath("/payroll");
    return { success: true, data: { id: entry.id } };
  } catch (err) {
    console.error("[setSalaryRate]", err);
    return { success: false, error: "Stavkani saqlab bo'lmadi" };
  }
}