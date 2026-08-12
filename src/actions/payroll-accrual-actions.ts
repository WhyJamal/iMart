"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreatePayrollAccrualSchema,
  UpdateAccrualLineSchema,
  type CreatePayrollAccrualInput,
  type UpdateAccrualLineInput,
} from "@/schema/payroll-accrual.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type {
  IPayrollAccrualSummary,
  IPayrollAccrualDetail,
  SalaryType,
} from "@/types/payroll-accrual.types";
import type { CashMethod } from "@/types/cash.types";
import { recordCashFlow, reverseCashFlowsByDoc } from "@/actions/cash-actions";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPayrollAccruals(): Promise<IPayrollAccrualSummary[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const rows = await prisma.payrollAccrual.findMany({
    where: { organizationId: session.organizationId },
    include: {
      point: { select: { name: true } },
      lines: { select: { payAmount: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((r: (typeof rows)[number]) => ({
    id: r.id,
    pointId: r.pointId,
    pointName: r.point.name,
    year: r.year,
    month: r.month,
    status: r.status as "DRAFT" | "CONFIRMED",
    lineCount: r.lines.length,
    totalPayAmount: r.lines.reduce(
      (sum: number, l: { payAmount: unknown }) => sum + Number(l.payAmount),
      0
    ),
    createdAt: r.createdAt,
  }));
}

export async function getPayrollAccrualDetail(
  id: string
): Promise<IPayrollAccrualDetail | null> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const accrual = await prisma.payrollAccrual.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      point: { select: { name: true } },
      lines: { include: { user: { select: { name: true } } } },
    },
  });
  if (!accrual) return null;

  return {
    id: accrual.id,
    pointId: accrual.pointId,
    pointName: accrual.point.name,
    year: accrual.year,
    month: accrual.month,
    status: accrual.status as "DRAFT" | "CONFIRMED",
    lines: accrual.lines.map((l: (typeof accrual.lines)[number]) => ({
      id: l.id,
      userId: l.userId,
      userName: l.user.name,
      salaryType: l.salaryType as SalaryType,
      rate: Number(l.rate),
      workedUnits: l.workedUnits === null ? null : Number(l.workedUnits),
      grossAmount: Number(l.grossAmount),
      alreadyPaid: Number(l.alreadyPaid),
      bonus: Number(l.bonus),
      deduction: Number(l.deduction),
      payAmount: Number(l.payAmount),
      paymentMethod: l.paymentMethod,
    })),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createPayrollAccrual(
  input: CreatePayrollAccrualInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "payroll:manage");
    if (denied) return denied;

    const parsed = CreatePayrollAccrualSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { pointId, year, month } = parsed.data;

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    const accrual = await prisma.payrollAccrual.create({
      data: {
        organizationId: session.organizationId,
        pointId,
        year,
        month,
        createdBy: session.userId,
      },
    });

    revalidatePath("/payroll");
    return { success: true, data: { id: accrual.id } };
  } catch (err) {
    console.error("[createPayrollAccrual]", err);
    return { success: false, error: "Hujjatni yaratib bo'lmadi" };
  }
}

export async function deletePayrollAccrual(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "payroll:manage");
    if (denied) return denied;

    const accrual = await prisma.payrollAccrual.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!accrual) return { success: false, error: "Hujjat topilmadi" };

    await prisma.$transaction(async (tx: TxClient) => {
      if (accrual.status === "CONFIRMED") {
        await reverseCashFlowsByDoc(tx, "PAYROLL", id);
      }
      await tx.payrollAccrual.delete({ where: { id } });
    });

    revalidatePath("/payroll");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deletePayrollAccrual]", err);
    return { success: false, error: "Hujjatni o'chirib bo'lmadi" };
  }
}

/**
 * "Заполнить" — shu Point'dagi har bir xodim uchun:
 *  1. SalaryRegister'dan joriy stavkani oladi
 *  2. Timesheet'dan (shu Point+Oy) ishlagan kun/soatni hisoblaydi
 *  3. Umumiy hisoblangan summani chiqaradi
 *  4. Shu oy uchun OLDIN (boshqa CONFIRMED hujjatlarda) to'langan
 *     summani ayiradi
 *  5. Qolgan summa 0 dan katta bo'lsagina qator qo'shiladi —
 *     to'liq to'langan xodimlar keyingi "Заполнить"da qayta
 *     ko'rinmaydi.
 */
export async function fillPayrollAccrual(
  accrualId: string
): Promise<ActionResult<{ addedCount: number }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "payroll:manage");
    if (denied) return denied;

    const accrual = await prisma.payrollAccrual.findFirst({
      where: { id: accrualId, organizationId: session.organizationId },
    });
    if (!accrual) return { success: false, error: "Hujjat topilmadi" };
    if (accrual.status === "CONFIRMED") {
      return { success: false, error: "Tasdiqlangan hujjatni to'ldirib bo'lmaydi" };
    }

    const users = await prisma.user.findMany({
      where: { organizationId: session.organizationId, pointId: accrual.pointId },
      select: { id: true },
    });

    const timesheet = await prisma.timesheet.findFirst({
      where: { pointId: accrual.pointId, year: accrual.year, month: accrual.month },
    });

    const existingLineUserIds = new Set(
      (
        await prisma.payrollAccrualLine.findMany({
          where: { accrualId },
          select: { userId: true },
        })
      ).map((l: { userId: string }) => l.userId)
    );

    let addedCount = 0;

    await prisma.$transaction(async (tx: TxClient) => {
      for (const u of users) {
        if (existingLineUserIds.has(u.id)) continue; // allaqachon shu hujjatda bor

        const salary = await tx.salaryRegister.findFirst({
          where: { organizationId: session.organizationId, userId: u.id },
          orderBy: { effectiveFrom: "desc" },
        });
        if (!salary) continue; // stavka belgilanmagan xodim o'tkazib yuboriladi

        const salaryType = salary.salaryType as SalaryType;
        const rate = Number(salary.rate);

        let workedUnits: number | null = null;
        if (salaryType !== "FIXED" && timesheet) {
          const entries = await tx.timesheetEntry.findMany({
            where: { timesheetId: timesheet.id, userId: u.id },
          });
          if (salaryType === "HOURLY") {
            workedUnits = entries.reduce(
              (sum: number, e: { hours: unknown }) => sum + Number(e.hours),
              0
            );
          } else {
            workedUnits = entries.filter(
              (e: { hours: unknown }) => Number(e.hours) > 0
            ).length;
          }
        } else if (salaryType !== "FIXED") {
          workedUnits = 0;
        }

        const grossAmount =
          salaryType === "FIXED" ? rate : (workedUnits ?? 0) * rate;

        const priorLines = await tx.payrollAccrualLine.findMany({
          where: {
            userId: u.id,
            accrual: {
              pointId: accrual.pointId,
              year: accrual.year,
              month: accrual.month,
              status: "CONFIRMED",
            },
          },
          select: { payAmount: true },
        });
        const alreadyPaid = priorLines.reduce(
          (sum: number, l: { payAmount: unknown }) => sum + Number(l.payAmount),
          0
        );

        const remaining = Math.max(0, grossAmount - alreadyPaid);
        if (remaining <= 0) continue;

        await tx.payrollAccrualLine.create({
          data: {
            accrualId,
            userId: u.id,
            salaryType,
            rate,
            workedUnits,
            grossAmount,
            alreadyPaid,
            bonus: 0,
            deduction: 0,
            payAmount: remaining,
            paymentMethod: "cash",
          },
        });
        addedCount += 1;
      }
    });

    revalidatePath(`/payroll/${accrualId}`);
    return { success: true, data: { addedCount } };
  } catch (err) {
    console.error("[fillPayrollAccrual]", err);
    return { success: false, error: "Hujjatni to'ldirib bo'lmadi" };
  }
}

export async function updateAccrualLine(
  input: UpdateAccrualLineInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "payroll:manage");
    if (denied) return denied;

    const parsed = UpdateAccrualLineSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { lineId, payAmount, bonus, deduction, paymentMethod } = parsed.data;

    const line = await prisma.payrollAccrualLine.findFirst({
      where: { id: lineId, accrual: { organizationId: session.organizationId } },
      include: { accrual: true },
    });
    if (!line) return { success: false, error: "Qator topilmadi" };
    if (line.accrual.status === "CONFIRMED") {
      return { success: false, error: "Tasdiqlangan hujjatni tahrirlab bo'lmaydi" };
    }

    await prisma.payrollAccrualLine.update({
      where: { id: lineId },
      data: {
        payAmount,
        ...(bonus !== undefined ? { bonus } : {}),
        ...(deduction !== undefined ? { deduction } : {}),
        ...(paymentMethod !== undefined ? { paymentMethod } : {}),
      },
    });

    revalidatePath(`/payroll/${line.accrualId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateAccrualLine]", err);
    return { success: false, error: "Qatorni saqlab bo'lmadi" };
  }
}

/**
 * "Записать и закрыть" — hujjatni yakuniy tasdiqlaydi. Har bir
 * qatordagi payAmount uchun kassa/bank balansidan avtomatik chiqim
 * yoziladi. Hujjat = hisoblash + to'lov, alohida bosqich kerak emas.
 */
export async function confirmPayrollAccrual(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "payroll:manage");
    if (denied) return denied;

    const accrual = await prisma.payrollAccrual.findFirst({
      where: { id, organizationId: session.organizationId },
      include: { lines: { include: { user: { select: { name: true } } } } },
    });
    if (!accrual) return { success: false, error: "Hujjat topilmadi" };
    if (accrual.status === "CONFIRMED") {
      return { success: false, error: "Hujjat allaqachon tasdiqlangan" };
    }
    if (accrual.lines.length === 0) {
      return { success: false, error: "Hujjatda qatorlar yo'q" };
    }

    await prisma.$transaction(async (tx: TxClient) => {
      for (const line of accrual.lines) {
        const amount = Number(line.payAmount);
        if (amount <= 0) continue;

        await recordCashFlow(tx, {
          organizationId: session.organizationId,
          docType: "PAYROLL",
          docId: accrual.id,
          direction: "OUT",
          method: line.paymentMethod.toUpperCase() as CashMethod,
          amount,
          note: `Oylik: ${line.user.name}`,
          createdBy: session.userId,
        });
      }

      await tx.payrollAccrual.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });
    });

    revalidatePath("/payroll");
    revalidatePath(`/payroll/${id}`);
    revalidatePath("/cash");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[confirmPayrollAccrual]", err);
    return { success: false, error: "Hujjatni tasdiqlab bo'lmadi" };
  }
}
