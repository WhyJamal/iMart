"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { recordCashFlow } from "@/actions/cash-actions";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type { CashMethod } from "@/types/cash.types";
import type { ISupplierPayment } from "@/types/debtor.types";

/**
 * Bir kontragentga (SUPPLIER) bo'lgan joriy qarzimiz:
 * SUM(Purchase.totalAmount - Purchase.paidAmount) - SUM(SupplierPayment.amount)
 * Purchase'da alohida totalAmount ustuni yo'q — items orqali hisoblanadi.
 */
export async function getSupplierDebts(
  organizationId: string
): Promise<Map<string, number>> {
  const [purchases, payments] = await Promise.all([
    prisma.purchase.findMany({
      where: { organizationId, contragentId: { not: null } },
      select: {
        contragentId: true,
        paidAmount: true,
        items: { select: { qty: true, unitCost: true } },
      },
    }),
    prisma.supplierPayment.groupBy({
      by: ["contragentId"],
      where: { organizationId },
      _sum: { amount: true },
    }),
  ]);

  const map = new Map<string, number>();
  for (const p of purchases) {
    if (!p.contragentId) continue;
    const total = p.items.reduce(
      (sum: number, i: { qty: unknown; unitCost: unknown }) =>
        sum + Number(i.qty) * Number(i.unitCost),
      0
    );
    const unpaid = total - Number(p.paidAmount);
    map.set(p.contragentId, (map.get(p.contragentId) ?? 0) + unpaid);
  }
  for (const row of payments) {
    const prev = map.get(row.contragentId) ?? 0;
    map.set(row.contragentId, prev - Number(row._sum.amount ?? 0));
  }
  return map;
}

export async function getSupplierPayments(
  contragentId: string
): Promise<ISupplierPayment[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const rows = await prisma.supplierPayment.findMany({
    where: { contragentId, organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r: (typeof rows)[number]) => ({
    id: r.id,
    contragentId: r.contragentId,
    amount: Number(r.amount),
    method: r.method,
    note: r.note,
    createdAt: r.createdAt,
  }));
}

/**
 * Do'kon egasi yetkazib beruvchiga qarzni (qisman yoki to'liq) keyinroq
 * to'laganida ishlatiladi. Kassa/bankdan pul chiqimi sifatida ham
 * yoziladi (DEBT_PAY).
 */
export async function createSupplierPayment(input: {
  contragentId: string;
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

    const contragent = await prisma.contragent.findFirst({
      where: {
        id: input.contragentId,
        organizationId: session.organizationId,
        type: "SUPPLIER",
      },
    });
    if (!contragent) return { success: false, error: "Kontragent topilmadi" };

    const debts = await getSupplierDebts(session.organizationId);
    const currentDebt = debts.get(contragent.id) ?? 0;
    if (currentDebt <= 0) {
      return { success: false, error: "Bu kontragentga qarzingiz yo'q" };
    }
    const amount = Math.min(input.amount, currentDebt);

    const payment = await prisma.$transaction(async (tx: TxClient) => {
      const created = await tx.supplierPayment.create({
        data: {
          organizationId: session.organizationId,
          contragentId: contragent.id,
          amount,
          method: input.method,
          note: input.note?.trim() || null,
          createdBy: session.userId,
        },
      });

      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "DEBT_PAY",
        docId: created.id,
        direction: "OUT",
        method: input.method as CashMethod,
        amount,
        note: `Qarz to'lovi: ${contragent.name}`,
        createdBy: session.userId,
      });

      return created;
    });

    revalidatePath("/contragents");
    revalidatePath("/cash");

    return { success: true, data: { id: payment.id } };
  } catch (err) {
    console.error("[createSupplierPayment]", err);
    return { success: false, error: "Failed to record payment" };
  }
}
