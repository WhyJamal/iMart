"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import type { CashFlow } from "@/generated/prisma/client";
import { CreateCashFlowSchema, type CreateCashFlowInput } from "@/schema/cash.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type {
  TCashFlowSerialized,
  TCashRegisterSerialized,
  TBankAccountSerialized,
  CashDocType,
  CashDirection,
  CashMethod,
} from "@/types/cash.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Bitta magazin — bitta kassa.
 * Organization uchun kassa hali ochilmagan bo'lsa, avtomatik yaratadi.
 */
export async function getOrCreateCashRegister(
  tx: TxClient | typeof prisma,
  organizationId: string
) {
  const existing = await tx.cashRegister.findUnique({
    where: { organizationId },
  });
  if (existing) return existing;

  return tx.cashRegister.create({
    data: { organizationId, balance: 0 },
  });
}

/**
 * Bitta magazin — bitta bank hisobi (karta/QR to'lovlar shu yerga tushadi).
 */
export async function getOrCreateBankAccount(
  tx: TxClient | typeof prisma,
  organizationId: string
) {
  const existing = await tx.bankAccount.findUnique({
    where: { organizationId },
  });
  if (existing) return existing;

  return tx.bankAccount.create({
    data: { organizationId, balance: 0 },
  });
}

/**
 * Ichki helper — Sale/Purchase yaratilganda (yoki qo'lda) kassaga yozuv
 * qo'shadi. Faqat "CASH" usulidagi harakatlar kassa balansiga ta'sir
 * qiladi; karta/QR orqali to'lovlar ham audit uchun yoziladi, lekin
 * naqd qoldiqni o'zgartirmaydi.
 */
export async function recordCashFlow(
  tx: TxClient,
  params: {
    organizationId: string;
    docType: CashDocType;
    docId: string | null;
    direction: CashDirection;
    method: CashMethod;
    amount: number;
    note?: string | null;
    createdBy?: string | null;
  }
) {
  const isCash = params.method === "CASH";

  const register = isCash
    ? await getOrCreateCashRegister(tx, params.organizationId)
    : await getOrCreateBankAccount(tx, params.organizationId);

  const entry = await tx.cashFlow.create({
    data: {
      organizationId: params.organizationId,
      cashRegisterId: isCash ? register.id : null,
      bankAccountId: isCash ? null : register.id,
      docType: params.docType,
      docId: params.docId,
      direction: params.direction,
      method: params.method,
      amount: params.amount,
      note: params.note ?? null,
      createdBy: params.createdBy ?? null,
    },
  });

  const balanceDelta =
    params.direction === "IN"
      ? { increment: params.amount }
      : { decrement: params.amount };

  if (isCash) {
    await tx.cashRegister.update({ where: { id: register.id }, data: { balance: balanceDelta } });
  } else {
    await tx.bankAccount.update({ where: { id: register.id }, data: { balance: balanceDelta } });
  }

  return entry;
}

/**
 * Sale/Purchase o'chirilganda unga tegishli kassa yozuvlarini bekor
 * qiladi va (agar naqd bo'lsa) balansni orqaga qaytaradi.
 */
export async function reverseCashFlowsByDoc(
  tx: TxClient,
  docType: CashDocType,
  docId: string
) {
  const entries = await tx.cashFlow.findMany({ where: { docType, docId } });

  for (const entry of entries) {
    const reverseDelta =
      entry.direction === "IN"
        ? { decrement: entry.amount }
        : { increment: entry.amount };

    if (entry.method === "CASH" && entry.cashRegisterId) {
      await tx.cashRegister.update({
        where: { id: entry.cashRegisterId },
        data: { balance: reverseDelta },
      });
    } else if (entry.bankAccountId) {
      await tx.bankAccount.update({
        where: { id: entry.bankAccountId },
        data: { balance: reverseDelta },
      });
    }
  }

  await tx.cashFlow.deleteMany({ where: { docType, docId } });
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCashRegister(): Promise<TCashRegisterSerialized> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const register = await getOrCreateCashRegister(prisma, session.organizationId);

  return { ...register, balance: Number(register.balance) };
}

export async function getBankAccount(): Promise<TBankAccountSerialized> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const account = await getOrCreateBankAccount(prisma, session.organizationId);

  return { ...account, balance: Number(account.balance) };
}

export async function getCashFlows(): Promise<TCashFlowSerialized[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const entries = await prisma.cashFlow.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return entries.map((entry: CashFlow) => ({
    ...entry,
    amount: Number(entry.amount),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Qo'lda kassa harakati: pul kiritish, pul chiqarish, xarajat, tuzatish.
 */
export async function createCashFlow(
  input: CreateCashFlowInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const parsed = CreateCashFlowSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { docType, direction, method, amount, note } = parsed.data;

    const entry = await prisma.$transaction(async (tx: TxClient) => {
      return recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType,
        docId: null,
        direction,
        method,
        amount,
        note,
        createdBy: session.userId,
      });
    });

    revalidatePath("/cash");

    return { success: true, data: { id: entry.id } };
  } catch (err) {
    console.error("[createCashFlow]", err);
    return { success: false, error: "Failed to record cash flow" };
  }
}

export async function deleteCashFlow(id: string): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const entry = await prisma.cashFlow.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!entry) return { success: false, error: "Cash flow entry not found" };

    // SALE/PURCHASE orqali avtomatik yozilgan yozuvlarni bu yerdan
    // o'chirib bo'lmaydi — ular tegishli hujjat o'chirilganda bekor qilinadi
    if (entry.docType === "SALE" || entry.docType === "PURCHASE") {
      return {
        success: false,
        error: "Cannot delete a cash flow linked to a sale or purchase",
      };
    }

    await prisma.$transaction(async (tx: TxClient) => {
      const reverseDelta =
        entry.direction === "IN"
          ? { decrement: entry.amount }
          : { increment: entry.amount };

      if (entry.method === "CASH" && entry.cashRegisterId) {
        await tx.cashRegister.update({
          where: { id: entry.cashRegisterId },
          data: { balance: reverseDelta },
        });
      } else if (entry.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: entry.bankAccountId },
          data: { balance: reverseDelta },
        });
      }
      await tx.cashFlow.delete({ where: { id } });
    });

    revalidatePath("/cash");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteCashFlow]", err);
    return { success: false, error: "Failed to delete cash flow entry" };
  }
}