"use server";

  import { revalidatePath } from "next/cache";
  import { prisma } from "@/lib/prisma";
  import { getServerSession } from "@/lib/auth";
  import { checkPermission } from "@/lib/permissions";
  import {
    SetSalaryRateSchema,
    CreatePayrollPaymentSchema,
    type SetSalaryRateInput,
    type CreatePayrollPaymentInput,
  } from "@/schema/payroll.schema";
  import type { ActionResult } from "@/types/action-result.types";
  import type { TxClient } from "@/types/prisma.types";
  import type { CashMethod } from "@/types/cash.types";
  import type { SalaryType } from "@/types/salary.types";
  import type { IPayrollPayment} from "@/types/payroll.types";
  import { recordCashFlow, reverseCashFlowsByDoc } from "@/actions/cash-actions";

export async function getPayrollHistory(): Promise<IPayrollPayment[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const payments = await prisma.payrollPayment.findMany({
    where: { organizationId: session.organizationId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return payments.map((p: (typeof payments)[number]) => ({
    id: p.id,
    userId: p.userId,
    userName: p.user.name,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    salaryType: p.salaryType as SalaryType,
    rate: Number(p.rate),
    workedUnits: p.workedUnits === null ? null : Number(p.workedUnits),
    bonus: Number(p.bonus),
    deduction: Number(p.deduction),
    totalAmount: Number(p.totalAmount),
    paymentMethod: p.paymentMethod,
    note: p.note,
    createdAt: p.createdAt,
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * createPayrollPayment — oylik to'lash.
 *
 * Steps (bitta tranzaksiyada):
 *  1. Xodimning HOZIRGI stavkasi (SalaryRegister) o'qiladi.
 *  2. Tur bo'yicha summa hisoblanadi:
 *     FIXED   -> rate
 *     DAILY   -> workedUnits(kun) * rate
 *     HOURLY  -> workedUnits(soat) * rate
 *     so'ng + bonus - deduction
 *  3. PayrollPayment yoziladi — rate/salaryType shu yerga SNAPSHOT
 *     qilinadi (SalaryRegister keyin o'zgarsa ham tarix buzilmaydi).
 *  4. recordCashFlow() orqali kassa/bank balansidan avtomatik ayiriladi
 *     (docType: "PAYROLL", direction: "OUT").
 */
export async function createPayrollPayment(
  input: CreatePayrollPaymentInput
): Promise<ActionResult<{ id: string; totalAmount: number }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "payroll:manage");
    if (denied) return denied;

    const parsed = CreatePayrollPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const {
      userId,
      periodStart,
      periodEnd,
      workedUnits,
      bonus,
      deduction,
      paymentMethod,
      note,
    } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId: session.organizationId },
    });
    if (!user) return { success: false, error: "Foydalanuvchi topilmadi" };

    const currentSalary = await prisma.salaryRegister.findFirst({
      where: { organizationId: session.organizationId, userId },
      orderBy: { effectiveFrom: "desc" },
    });
    if (!currentSalary) {
      return {
        success: false,
        error: "Avval xodimga stavka belgilang (Set salary)",
      };
    }

    const salaryType = currentSalary.salaryType as SalaryType;
    const rate = Number(currentSalary.rate);

    if (salaryType !== "FIXED" && (workedUnits === undefined || workedUnits < 0)) {
      return {
        success: false,
        error:
          salaryType === "DAILY"
            ? "Ishlagan kunlar sonini kiriting"
            : "Ishlagan soatlar sonini kiriting",
      };
    }

    const base =
      salaryType === "FIXED" ? rate : (workedUnits ?? 0) * rate;
    const totalAmount = base + bonus - deduction;

    if (totalAmount < 0) {
      return { success: false, error: "Yakuniy summa manfiy bo'lishi mumkin emas" };
    }

    const payment = await prisma.$transaction(async (tx: TxClient) => {
      const doc = await tx.payrollPayment.create({
        data: {
          organizationId: session.organizationId,
          userId,
          periodStart,
          periodEnd,
          salaryType,
          rate,
          workedUnits: salaryType === "FIXED" ? null : workedUnits,
          bonus,
          deduction,
          totalAmount,
          paymentMethod,
          note: note ?? null,
          createdBy: session.userId,
        },
      });

      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "PAYROLL",
        docId: doc.id,
        direction: "OUT",
        method: paymentMethod.toUpperCase() as CashMethod,
        amount: totalAmount,
        note: note ?? `Oylik: ${user.name}`,
        createdBy: session.userId,
      });

      return doc;
    });

    revalidatePath("/payroll");
    revalidatePath("/cash");

    return { success: true, data: { id: payment.id, totalAmount } };
  } catch (err) {
    console.error("[createPayrollPayment]", err);
    return { success: false, error: "Oylikni to'lab bo'lmadi" };
  }
}

export async function deletePayrollPayment(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "payroll:manage");
    if (denied) return denied;

    const payment = await prisma.payrollPayment.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!payment) return { success: false, error: "To'lov topilmadi" };

    await prisma.$transaction(async (tx: TxClient) => {
      await reverseCashFlowsByDoc(tx, "PAYROLL", id);
      await tx.payrollPayment.delete({ where: { id } });
    });

    revalidatePath("/payroll");
    revalidatePath("/cash");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deletePayrollPayment]", err);
    return { success: false, error: "To'lovni o'chirib bo'lmadi" };
  }
}
