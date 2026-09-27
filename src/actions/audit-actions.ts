"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import type {
  AuditAction,
  AuditEntityType,
  IAuditLog,
  IAuditLogFilters,
} from "@/types/audit.types";

const PAGE_SIZE = 50;

function toDTO(row: {
  id: string;
  userId: string | null;
  user: { name: string } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: Date;
}): IAuditLog {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.user?.name ?? null,
    action: row.action as AuditAction,
    entityType: row.entityType as AuditEntityType,
    entityId: row.entityId,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── Yozish (ichki yordamchi) ────────────────────────────────────────────────
//
// logAudit — boshqa server action'lar (create/update/delete) ichidan,
// asosiy amal MUVAFFAQIYATLI bo'lgandan KEYIN chaqiriladi. Bu "use
// server" fayl ichida, lekin public UI'dan to'g'ridan-to'g'ri
// chaqirilishi nazarda tutilmagan — boshqa action ichidan import qilib
// ishlatiladi (notifyUsers patterni bilan bir xil).
//
// Xato bo'lsa ham asosiy amalni bloklamaydi/qaytarmaydi — faqat
// konsolga yoziladi, chunki audit yozib bo'lmasligi haqiqiy operatsiyani
// (masalan sotuvni o'chirishni) to'xtatishi noto'g'ri bo'lardi.
export async function logAudit(input: {
  organizationId: string;
  userId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  summary: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
      },
    });
  } catch (err) {
    console.error("[logAudit]", err);
  }
}

// ─── O'qish ───────────────────────────────────────────────────────────────────

export async function getAuditLogs(
  filters?: IAuditLogFilters
): Promise<{ items: IAuditLog[]; total: number; pageSize: number }> {
  const session = await getServerSession();
  if (!session) return { items: [], total: 0, pageSize: PAGE_SIZE };

  const denied = checkPermission(session.role, "audit:read");
  if (denied) return { items: [], total: 0, pageSize: PAGE_SIZE };

  const page = filters?.page && filters.page > 0 ? filters.page : 1;

  const where = {
    organizationId: session.organizationId,
    ...(filters?.userId ? { userId: filters.userId } : {}),
    ...(filters?.entityType ? { entityType: filters.entityType } : {}),
    ...(filters?.action ? { action: filters.action } : {}),
    ...(filters?.dateFrom || filters?.dateTo
      ? {
          createdAt: {
            ...(filters?.dateFrom
              ? { gte: new Date(`${filters.dateFrom}T00:00:00`) }
              : {}),
            ...(filters?.dateTo
              ? { lte: new Date(`${filters.dateTo}T23:59:59`) }
              : {}),
          },
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items: rows.map(toDTO), total, pageSize: PAGE_SIZE };
}

// Filtr panelidagi "Foydalanuvchi" tanlovi uchun — shu tashkilotdagi
// barcha xodimlar ro'yxati (audit yozuvi hali bo'lmagan bo'lsa ham).
export async function getAuditLogUsers(): Promise<
  { id: string; name: string }[]
> {
  const session = await getServerSession();
  if (!session) return [];

  const denied = checkPermission(session.role, "audit:read");
  if (denied) return [];

  const memberships = await prisma.organizationMember.findMany({
    where: { organizationId: session.organizationId },
    select: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map(
    (m: { user: { id: string; name: string } }) => m.user
  );
}
