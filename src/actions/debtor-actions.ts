"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { recordCashFlow } from "@/actions/cash-actions";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type { CashMethod } from "@/types/cash.types";
import type {
  IDebtor,
  IDebtorOption,
  IDebtorPayment,
} from "@/types/debtor.types";

/**
 * Har bir mijozning joriy qarzini hisoblab beradi:
 * SUM(paymentMethod="debt" bo'lgan Sale.totalAmount) - SUM(DebtorPayment.amount)
 */
async function getDebtorBalances(
  organizationId: string
): Promise<Map<string, number>> {
  const [saleRows, paymentRows] = await Promise.all([
    prisma.sale.groupBy({
      by: ["debtorId"],
      where: {
        organizationId,
        paymentMethod: "debt",
        debtorId: { not: null },
      },
      _sum: { totalAmount: true },
    }),
    prisma.debtorPayment.groupBy({
      by: ["debtorId"],
      where: { organizationId },
      _sum: { amount: true },
    }),
  ]);

  const map = new Map<string, number>();
  for (const row of saleRows) {
    if (!row.debtorId) continue;
    map.set(row.debtorId, Number(row._sum.totalAmount ?? 0));
  }
  for (const row of paymentRows) {
    const prev = map.get(row.debtorId) ?? 0;
    map.set(row.debtorId, prev - Number(row._sum.amount ?? 0));
  }
  return map;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getDebtors(): Promise<(IDebtor & { debt: number })[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const [debtors, balances] = await Promise.all([
    prisma.debtor.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    getDebtorBalances(session.organizationId),
  ]);

  return debtors.map((d: (typeof debtors)[number]) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    createdAt: d.createdAt,
    debt: balances.get(d.id) ?? 0,
  }));
}

/**
 * POS'dagi "Qarz" combobox'i uchun — nomi va joriy qarzi bilan.
 * Ro'yxat kichik bo'lishi kutiladi (bir do'kon uchun), shuning uchun
 * hammasi bir martada olinadi va client tomonda qidiriladi.
 */
export async function getDebtorOptions(): Promise<IDebtorOption[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const [debtors, balances] = await Promise.all([
    prisma.debtor.findMany({
      where: { organizationId: session.organizationId },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    }),
    getDebtorBalances(session.organizationId),
  ]);

  return debtors.map((d: (typeof debtors)[number]) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    debt: balances.get(d.id) ?? 0,
  }));
}

export async function getDebtorPayments(
  debtorId: string
): Promise<IDebtorPayment[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const rows = await prisma.debtorPayment.findMany({
    where: { debtorId, organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r: (typeof rows)[number]) => ({
    id: r.id,
    debtorId: r.debtorId,
    amount: Number(r.amount),
    method: r.method,
    note: r.note,
    createdAt: r.createdAt,
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * POS'da yangi ism kiritilganda yoki "Mijozlar" sahifasida qo'lda
 * qo'shilganda ishlatiladi. Bir xil nomdagi mijoz allaqachon bor bo'lsa —
 * dublikat yaratilmaydi, mavjudi qaytariladi (POS'dagi "birinchi safar
 * yozadi, keyin select'dan chiqadi" oqimi shu orqali ishlaydi).
 */
export async function createDebtor(input: {
  name: string;
  phone?: string;
}): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const name = input.name.trim();
    if (!name) return { success: false, error: "Ism kiritilishi shart" };

    const existing = await prisma.debtor.findFirst({
      where: { organizationId: session.organizationId, name },
    });
    if (existing) {
      return { success: true, data: { id: existing.id, name: existing.name } };
    }

    const debtor = await prisma.debtor.create({
      data: {
        organizationId: session.organizationId,
        name,
        phone: input.phone?.trim() || null,
      },
    });

    revalidatePath("/debtors");
    return { success: true, data: { id: debtor.id, name: debtor.name } };
  } catch (err) {
    console.error("[createDebtor]", err);
    return { success: false, error: "Failed to create debtor" };
  }
}

/**
 * Mijoz kelib qarzini (to'liq yoki qisman) to'laganida ishlatiladi.
 * Kassa/bankka pul kirimi sifatida ham yoziladi (DEBT_COLLECT).
 */
export async function createDebtorPayment(input: {
  debtorId: string;
  amount: number;
  method: "CASH" | "CARD" | "QR";
  note?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "debts:manage");
    if (denied) return denied;

    if (input.amount <= 0) {
      return { success: false, error: "Summa musbat bo'lishi kerak" };
    }

    const debtor = await prisma.debtor.findFirst({
      where: { id: input.debtorId, organizationId: session.organizationId },
    });
    if (!debtor) return { success: false, error: "Mijoz topilmadi" };

    const balances = await getDebtorBalances(session.organizationId);
    const currentDebt = balances.get(debtor.id) ?? 0;
    if (currentDebt <= 0) {
      return { success: false, error: "Bu mijozning qarzi yo'q" };
    }
    // Qarzdan ortiqcha to'lov kiritilmasin — mavjud qarz bilan cheklaymiz
    const amount = Math.min(input.amount, currentDebt);

    const payment = await prisma.$transaction(async (tx: TxClient) => {
      const created = await tx.debtorPayment.create({
        data: {
          organizationId: session.organizationId,
          debtorId: debtor.id,
          amount,
          method: input.method,
          note: input.note?.trim() || null,
          createdBy: session.userId,
        },
      });

      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "DEBT_COLLECT",
        docId: created.id,
        direction: "IN",
        method: input.method as CashMethod,
        amount,
        note: `Qarz to'lovi: ${debtor.name}`,
        createdBy: session.userId,
      });

      return created;
    });

    revalidatePath("/debtors");
    revalidatePath("/cash");

    return { success: true, data: { id: payment.id } };
  } catch (err) {
    console.error("[createDebtorPayment]", err);
    return { success: false, error: "Failed to record payment" };
  }
}
