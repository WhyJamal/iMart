"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreateTimesheetSchema,
  SetTimesheetEntrySchema,
  type CreateTimesheetInput,
  type SetTimesheetEntryInput,
} from "@/schema/timesheet.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type {
  ITimesheetSummary,
  ITimesheetDetail,
  ITimesheetUserRow,
  ITimesheetEntry,
} from "@/types/timesheet.types";

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getTimesheets(): Promise<ITimesheetSummary[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const rows = await prisma.timesheet.findMany({
    where: { organizationId: session.organizationId },
    include: {
      point: { select: { name: true } },
      _count: { select: { entries: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  // Har bir timesheet uchun user soni (entries'dagi distinct userId)
  const withUserCount = await Promise.all(
    rows.map(async (r: (typeof rows)[number]) => {
      const distinctUsers = await prisma.timesheetEntry.findMany({
        where: { timesheetId: r.id },
        select: { userId: true },
        distinct: ["userId"],
      });
      return {
        id: r.id,
        pointId: r.pointId,
        pointName: r.point.name,
        year: r.year,
        month: r.month,
        status: r.status as "DRAFT" | "CONFIRMED",
        userCount: distinctUsers.length,
        createdAt: r.createdAt,
      };
    })
  );

  return withUserCount;
}

export async function getTimesheetDetail(
  id: string
): Promise<ITimesheetDetail | null> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const timesheet = await prisma.timesheet.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      point: { select: { name: true } },
      entries: {
        include: {
          user: { select: { id: true, name: true, workSchedule: { select: { name: true } } } },
        },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!timesheet) return null;

  const entries: ITimesheetEntry[] = timesheet.entries.map(
    (e: (typeof timesheet.entries)[number]) => ({
      userId: e.userId,
      date: e.date.toISOString().slice(0, 10),
      hours: Number(e.hours),
      dayKind: e.dayKind,
      isManual: e.isManual,
    })
  );

  // Har bir user bo'yicha jamlanma
  const userMap = new Map<string, ITimesheetUserRow>();
  for (const e of timesheet.entries) {
    if (!userMap.has(e.userId)) {
      userMap.set(e.userId, {
        userId: e.userId,
        userName: e.user.name,
        workScheduleName: e.user.workSchedule?.name ?? null,
        totalHours: 0,
        totalDays: 0,
      });
    }
    const row = userMap.get(e.userId)!;
    const hours = Number(e.hours);
    if (hours > 0) {
      row.totalHours += hours;
      row.totalDays += 1;
    }
  }

  return {
    id: timesheet.id,
    pointId: timesheet.pointId,
    pointName: timesheet.point.name,
    year: timesheet.year,
    month: timesheet.month,
    status: timesheet.status as "DRAFT" | "CONFIRMED",
    users: Array.from(userMap.values()).sort((a, b) =>
      a.userName.localeCompare(b.userName)
    ),
    entries,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createTimesheet(
  input: CreateTimesheetInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const parsed = CreateTimesheetSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { pointId, year, month } = parsed.data;

    const point = await prisma.point.findFirst({
      where: { id: pointId, organizationId: session.organizationId },
    });
    if (!point) return { success: false, error: "Nuqta topilmadi" };

    const existing = await prisma.timesheet.findFirst({
      where: { pointId, year, month },
    });
    if (existing) {
      return { success: false, error: "Shu davr uchun tabel allaqachon mavjud" };
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        organizationId: session.organizationId,
        pointId,
        year,
        month,
        createdBy: session.userId,
      },
    });

    revalidatePath("/timesheets");
    return { success: true, data: { id: timesheet.id } };
  } catch (err) {
    console.error("[createTimesheet]", err);
    return { success: false, error: "Tabelni yaratib bo'lmadi" };
  }
}

export async function deleteTimesheet(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const existing = await prisma.timesheet.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Tabel topilmadi" };

    await prisma.timesheet.delete({ where: { id } });

    revalidatePath("/timesheets");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteTimesheet]", err);
    return { success: false, error: "Tabelni o'chirib bo'lmadi" };
  }
}

/**
 * "Заполнить сотрудников" — shu Point'ga biriktirilgan (User.pointId)
 * barcha xodimlarni tabelga qator sifatida qo'shadi (hozircha 0 soat
 * bilan — soatlarni "Заполнение табеля" to'ldiradi).
 */
export async function fillTimesheetUsers(
  timesheetId: string
): Promise<ActionResult<{ addedCount: number }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const timesheet = await prisma.timesheet.findFirst({
      where: { id: timesheetId, organizationId: session.organizationId },
    });
    if (!timesheet) return { success: false, error: "Tabel topilmadi" };

    const users = await prisma.user.findMany({
      where: { organizationId: session.organizationId, pointId: timesheet.pointId },
      select: { id: true },
    });

    const existingUserIds = new Set(
      (
        await prisma.timesheetEntry.findMany({
          where: { timesheetId },
          select: { userId: true },
          distinct: ["userId"],
        })
      ).map((e: { userId: string }) => e.userId)
    );

    const newUsers = users.filter(
      (u: (typeof users)[number]) => !existingUserIds.has(u.id)
    );
    if (newUsers.length === 0) {
      return { success: true, data: { addedCount: 0 } };
    }

    const dim = daysInMonth(timesheet.year, timesheet.month);
    const rows: {
      timesheetId: string;
      userId: string;
      date: Date;
      hours: number;
      dayKind: string;
      isManual: boolean;
    }[] = [];
    for (const u of newUsers) {
      for (let day = 1; day <= dim; day++) {
        rows.push({
          timesheetId,
          userId: u.id,
          date: new Date(`${dateKey(timesheet.year, timesheet.month, day)}T00:00:00.000Z`),
          hours: 0,
          dayKind: "workday",
          isManual: false,
        });
      }
    }

    await prisma.timesheetEntry.createMany({ data: rows });

    revalidatePath(`/timesheets/${timesheetId}`);
    return { success: true, data: { addedCount: newUsers.length } };
  } catch (err) {
    console.error("[fillTimesheetUsers]", err);
    return { success: false, error: "Xodimlarni qo'shib bo'lmadi" };
  }
}

/**
 * "Заполнение табеля" — tabeldagi har bir xodim uchun, uning
 * WorkSchedule'idagi (Grafik rabota) shu oy kunlaridagi soatlarni
 * ko'chirib yozadi. Qo'lda tuzatilgan (isManual: true) kunlarga
 * tegilmaydi.
 */
export async function fillTimesheetDays(
  timesheetId: string
): Promise<ActionResult<{ filledCount: number }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const timesheet = await prisma.timesheet.findFirst({
      where: { id: timesheetId, organizationId: session.organizationId },
    });
    if (!timesheet) return { success: false, error: "Tabel topilmadi" };

    const entryUserIds = (
      await prisma.timesheetEntry.findMany({
        where: { timesheetId },
        select: { userId: true },
        distinct: ["userId"],
      })
    ).map((e: { userId: string }) => e.userId);

    if (entryUserIds.length === 0) {
      return {
        success: false,
        error: "Avval \"Заполнить сотрудников\" bilan xodimlarni qo'shing",
      };
    }

    const users = await prisma.user.findMany({
      where: { id: { in: entryUserIds } },
      select: { id: true, workScheduleId: true },
    });

    const dim = daysInMonth(timesheet.year, timesheet.month);
    const rangeStart = new Date(
      `${dateKey(timesheet.year, timesheet.month, 1)}T00:00:00.000Z`
    );
    const rangeEnd = new Date(
      `${dateKey(timesheet.year, timesheet.month, dim)}T23:59:59.999Z`
    );

    let filledCount = 0;

    await prisma.$transaction(async (tx: TxClient) => {
      for (const user of users) {
        if (!user.workScheduleId) continue; // grafik biriktirilmagan — o'tkazib yuboriladi

        const schedule = await tx.workSchedule.findUnique({
          where: { id: user.workScheduleId },
        });
        // Faqat shu yilga mos grafik ishlatiladi
        if (!schedule || schedule.year !== timesheet.year) continue;

        const scheduleDays = await tx.workScheduleDay.findMany({
          where: {
            scheduleId: schedule.id,
            date: { gte: rangeStart, lte: rangeEnd },
          },
        });
        const byDate = new Map<string, (typeof scheduleDays)[number]>(
          scheduleDays.map((d: (typeof scheduleDays)[number]) => [
            d.date.toISOString().slice(0, 10),
            d,
          ])
        );

        // Qo'lda tuzatilgan kunlarni bilib olamiz
        const manualEntries = await tx.timesheetEntry.findMany({
          where: { timesheetId, userId: user.id, isManual: true },
          select: { date: true },
        });
        const manualDates = new Set(
          manualEntries.map((e: { date: Date }) => e.date.toISOString().slice(0, 10))
        );

        for (let day = 1; day <= dim; day++) {
          const key = dateKey(timesheet.year, timesheet.month, day);
          if (manualDates.has(key)) continue;

          const sd = byDate.get(key);
          const hours = sd ? Number(sd.hours) : 0;
          const dayKind = sd ? sd.dayKind : "workday";

          await tx.timesheetEntry.update({
            where: {
              timesheetId_userId_date: {
                timesheetId,
                userId: user.id,
                date: new Date(`${key}T00:00:00.000Z`),
              },
            },
            data: { hours, dayKind },
          });
          filledCount += 1;
        }
      }
    });

    revalidatePath(`/timesheets/${timesheetId}`);
    return { success: true, data: { filledCount } };
  } catch (err) {
    console.error("[fillTimesheetDays]", err);
    return { success: false, error: "Tabelni to'ldirib bo'lmadi" };
  }
}

/**
 * Bitta xodimning bitta kunini qo'lda tuzatish (kelmagan/kech qolgan
 * va h.k.). Shundan keyin bu kun keyingi "Заполнение табеля"da qayta
 * yozilmaydi.
 */
export async function setTimesheetEntry(
  input: SetTimesheetEntryInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const parsed = SetTimesheetEntrySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { timesheetId, userId, date, hours } = parsed.data;

    const timesheet = await prisma.timesheet.findFirst({
      where: { id: timesheetId, organizationId: session.organizationId },
    });
    if (!timesheet) return { success: false, error: "Tabel topilmadi" };

    await prisma.timesheetEntry.upsert({
      where: {
        timesheetId_userId_date: {
          timesheetId,
          userId,
          date: new Date(`${date}T00:00:00.000Z`),
        },
      },
      create: {
        timesheetId,
        userId,
        date: new Date(`${date}T00:00:00.000Z`),
        hours,
        dayKind: "workday",
        isManual: true,
      },
      update: {
        hours,
        isManual: true,
      },
    });

    revalidatePath(`/timesheets/${timesheetId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[setTimesheetEntry]", err);
    return { success: false, error: "Kunni saqlab bo'lmadi" };
  }
}
