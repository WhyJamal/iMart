"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreateCashFlowSchema,
  type CreateCashFlowInput,
  CreateCashTransferSchema,
  type CreateCashTransferInput,
} from "@/schema/cash.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import { CASH_NO_POINT } from "@/types/cash.types";
import type {
  TCashFlowSerialized,
  TCashRegisterSerialized,
  TBankAccountSerialized,
  ICashFilter,
  ICashPointSummary,
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
 *
 * pointId — yozuv qaysi nuqta (foyda markazi) hisobiga tegishli.
 * Berilmasa (yoki null) yozuv "umumiy / nuqtasiz" bo'ladi. Chaqiruvchi
 * pointId shu tashkilotga tegishli ekanini o'zi tekshiradi (odatda u
 * allaqachon Sale/Purchase/PayrollAccrual'dan olingan bo'ladi).
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
    pointId?: string | null;
  }
) {
  const isCash = params.method === "CASH";

  // Nuqta (foyda markazi) balansi manfiy bo'lib qolishini oldini olish.
  // "Nuqtasiz (umumiy)" pul cheksiz hisoblanadi — u yerdan istalgan
  // vaqt aniq nuqtaga o'tkazish mumkin, shuning uchun faqat aniq nuqta
  // tanlangan chiqimlar tekshiriladi.
  if (params.direction === "OUT" && params.pointId) {
    const grouped = await tx.cashFlow.groupBy({
      by: ["direction"],
      where: {
        organizationId: params.organizationId,
        pointId: params.pointId,
        method: isCash ? "CASH" : { in: ["CARD", "QR"] },
      },
      _sum: { amount: true },
    });

    const inSum = Number(
      (grouped as { direction: string; _sum: { amount: unknown } }[]).find(
        (g) => g.direction === "IN"
      )?._sum.amount ?? 0
    );
    const outSum = Number(
      (grouped as { direction: string; _sum: { amount: unknown } }[]).find(
        (g) => g.direction === "OUT"
      )?._sum.amount ?? 0
    );
    const available = inSum - outSum;

    if (available < params.amount) {
      const shortfall = params.amount - available;
      const point = await tx.point.findUnique({
        where: { id: params.pointId },
        select: { name: true },
      });
      const methodLabel = isCash ? "naqd" : "bank/karta";
      const message =
        `Nuqtada mablag' yetarli emas: "${point?.name ?? ""}" ${methodLabel} ` +
        `balansi ${available.toLocaleString("uz-UZ")}, kerak ` +
        `${params.amount.toLocaleString("uz-UZ")}. Umumiy pulni shu ` +
        `nuqtaga o'tkazing.`;
      throw new Error(
        `POINT_FUNDS::${params.pointId}::${shortfall}::${message}`
      );
    }
  }

  const register = isCash
    ? await getOrCreateCashRegister(tx, params.organizationId)
    : await getOrCreateBankAccount(tx, params.organizationId);

  const entry = await tx.cashFlow.create({
    data: {
      organizationId: params.organizationId,
      cashRegisterId: isCash ? register.id : null,
      bankAccountId: isCash ? null : register.id,
      pointId: params.pointId ?? null,
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

/**
 * Filtr -> Prisma where. Barcha so'rovlar (ro'yxat va nuqtalar
 * bo'yicha yig'indi) bir xil filtrni ishlatishi uchun bitta joyda.
 */
function buildCashWhere(organizationId: string, filter?: ICashFilter) {
  const where: {
    organizationId: string;
    pointId?: string | null;
    createdAt?: { gte?: Date; lte?: Date };
  } = { organizationId };

  if (filter?.pointId === CASH_NO_POINT) {
    where.pointId = null;
  } else if (filter?.pointId) {
    where.pointId = filter.pointId;
  }

  const from = filter?.dateFrom
    ? new Date(`${filter.dateFrom}T00:00:00`)
    : null;
  const to = filter?.dateTo
    ? new Date(`${filter.dateTo}T23:59:59.999`)
    : null;

  if (from && !Number.isNaN(from.getTime())) {
    where.createdAt = { ...where.createdAt, gte: from };
  }
  if (to && !Number.isNaN(to.getTime())) {
    where.createdAt = { ...where.createdAt, lte: to };
  }

  return where;
}

export async function getCashFlows(
  filter?: ICashFilter
): Promise<TCashFlowSerialized[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const entries = await prisma.cashFlow.findMany({
    where: buildCashWhere(session.organizationId, filter),
    include: { point: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return entries.map(({ point, ...entry }: (typeof entries)[number]) => ({
    ...entry,
    amount: Number(entry.amount),
    pointName: point?.name ?? null,
  }));
}

/**
 * Nuqtalar (foyda markazlari) bo'yicha pul oqimi: har bir nuqta uchun
 * naqd/bank kirim-chiqim va sof natija. Filtrdagi pointId shu yerda
 * ham hisobga olinadi (bitta nuqta tanlansa — faqat o'sha qator).
 */
export async function getCashPointSummary(
  filter?: ICashFilter
): Promise<ICashPointSummary[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const grouped = await prisma.cashFlow.groupBy({
    by: ["pointId", "direction", "method"],
    where: buildCashWhere(session.organizationId, filter),
    _sum: { amount: true },
  });

  const pointIds = [
    ...new Set(
      grouped
        .map((g: (typeof grouped)[number]) => g.pointId)
        .filter((id: string | null): id is string => id !== null)
    ),
  ];

  const points = pointIds.length
    ? await prisma.point.findMany({
        where: { organizationId: session.organizationId, id: { in: pointIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map<string, string>(
    points.map((p: { id: string; name: string }) => [p.id, p.name])
  );

  const rows = new Map<string, ICashPointSummary>();

  for (const g of grouped as {
    pointId: string | null;
    direction: string;
    method: string;
    _sum: { amount: unknown };
  }[]) {
    const key = g.pointId ?? CASH_NO_POINT;
    let row = rows.get(key);
    if (!row) {
      row = {
        pointId: g.pointId,
        pointName: g.pointId ? nameById.get(g.pointId) ?? null : null,
        cashIn: 0,
        cashOut: 0,
        bankIn: 0,
        bankOut: 0,
        totalIn: 0,
        totalOut: 0,
        net: 0,
      };
      rows.set(key, row);
    }

    const amount = Number(g._sum.amount ?? 0);
    const isCash = g.method === "CASH";

    if (g.direction === "IN") {
      if (isCash) row.cashIn += amount;
      else row.bankIn += amount;
      row.totalIn += amount;
    } else {
      if (isCash) row.cashOut += amount;
      else row.bankOut += amount;
      row.totalOut += amount;
    }
  }

  const result = [...rows.values()];
  for (const r of result) r.net = r.totalIn - r.totalOut;

  // Eng foydali nuqtalar tepada; "nuqtasiz" qator doim eng oxirida.
  return result.sort((a, b) => {
    if (a.pointId === null) return 1;
    if (b.pointId === null) return -1;
    return b.net - a.net;
  });
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

    // pointId berilmagan (undefined) bo'lsa — foydalanuvchining o'z
    // nuqtasi avtomatik olinadi; null — aniq "nuqtasiz (umumiy)".
    const pointId =
      parsed.data.pointId === undefined
        ? session.pointId
        : parsed.data.pointId;

    if (pointId) {
      const point = await prisma.point.findFirst({
        where: { id: pointId, organizationId: session.organizationId },
        select: { id: true },
      });
      if (!point) return { success: false, error: "Point not found" };
    }

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
        pointId,
      });
    });

    revalidatePath("/cash");

    return { success: true, data: { id: entry.id } };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("POINT_FUNDS::")) {
      return { success: false, error: err.message };
    }
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

/**
 * Ikki nuqta (foyda markazi) orasida pul o'tkazish. Umumiy kassa/bank
 * balansi o'zgarmaydi (bitta OUT + bitta IN, bir xil summa) — faqat
 * har bir nuqtaning pul oqim hisobotidagi ulushi o'zgaradi. Ikkala
 * yozuv bir xil docId bilan bog'lanadi, shuning uchun keyinchalik
 * ikkalasi birga bekor qilinishi mumkin (deleteCashTransfer).
 */
export async function createCashTransfer(
  input: CreateCashTransferInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "cash:write");
    if (denied) return denied;

    const parsed = CreateCashTransferSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { fromPointId, toPointId, method, amount, note } = parsed.data;

    for (const id of [fromPointId, toPointId]) {
      if (!id) continue;
      const point = await prisma.point.findFirst({
        where: { id, organizationId: session.organizationId },
        select: { id: true },
      });
      if (!point) return { success: false, error: "Point not found" };
    }

    const transferId = crypto.randomUUID();

    await prisma.$transaction(async (tx: TxClient) => {
      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "CASH_TRANSFER",
        docId: transferId,
        direction: "OUT",
        method,
        amount,
        note,
        createdBy: session.userId,
        pointId: fromPointId,
      });

      await recordCashFlow(tx, {
        organizationId: session.organizationId,
        docType: "CASH_TRANSFER",
        docId: transferId,
        direction: "IN",
        method,
        amount,
        note,
        createdBy: session.userId,
        pointId: toPointId,
      });
    });

    revalidatePath("/cash");

    return { success: true, data: { id: transferId } };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("POINT_FUNDS::")) {
      return { success: false, error: err.message };
    }
    console.error("[createCashTransfer]", err);
    return { success: false, error: "Failed to record transfer" };
  }
}

export async function deleteCashTransfer(
  docId: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "cash:write");
    if (denied) return denied;

    const entries = await prisma.cashFlow.findMany({
      where: {
        docType: "CASH_TRANSFER",
        docId,
        organizationId: session.organizationId,
      },
      select: { id: true },
    });
    if (entries.length === 0) {
      return { success: false, error: "Transfer not found" };
    }

    await prisma.$transaction(async (tx: TxClient) => {
      await reverseCashFlowsByDoc(tx, "CASH_TRANSFER", docId);
    });

    revalidatePath("/cash");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteCashTransfer]", err);
    return { success: false, error: "Failed to delete transfer" };
  }
}
