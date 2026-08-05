"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreateWorkCalendarSchema,
  SetCalendarDaySchema,
  type CreateWorkCalendarInput,
  type SetCalendarDayInput,
} from "@/schema/calendar.schema";
import type { ActionResult } from "@/types/action-result.types";
import type {
  ICalendarDayException,
  IWorkCalendarDetail,
  IWorkCalendarSummary,
} from "@/types/calendar.types";

function calendarName(year: number) {
  return `Ish kalendari ${year}`;
}

export async function getWorkCalendars(): Promise<IWorkCalendarSummary[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const calendars = await prisma.workCalendar.findMany({
    where: { organizationId: session.organizationId },
    include: { _count: { select: { days: true } } },
    orderBy: { year: "desc" },
  });

  return calendars.map((c: (typeof calendars)[number]) => ({
    id: c.id,
    year: c.year,
    name: c.name,
    isConfirmed: c.isConfirmed,
    confirmedAt: c.confirmedAt,
    exceptionsCount: c._count.days,
  }));
}

export async function getWorkCalendarDetail(
  year: number
): Promise<IWorkCalendarDetail | null> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const calendar = await prisma.workCalendar.findUnique({
    where: {
      organizationId_year: { organizationId: session.organizationId, year },
    },
    include: { days: { orderBy: { date: "asc" } } },
  });
  if (!calendar) return null;

  const exceptions: ICalendarDayException[] = calendar.days.map(
    (d: (typeof calendar.days)[number]) => ({
      date: d.date.toISOString().slice(0, 10),
      type: d.dayType as ICalendarDayException["type"],
      title: d.title,
      shortenedBy: d.shortenedBy != null ? Number(d.shortenedBy) : null,
    })
  );

  return {
    id: calendar.id,
    year: calendar.year,
    name: calendar.name,
    isConfirmed: calendar.isConfirmed,
    confirmedAt: calendar.confirmedAt,
    exceptions,
  };
}

export async function createWorkCalendar(
  input: CreateWorkCalendarInput
): Promise<ActionResult<{ id: string; year: number }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "calendar:manage");
    if (denied) return denied;

    const parsed = CreateWorkCalendarSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existing = await prisma.workCalendar.findUnique({
      where: {
        organizationId_year: {
          organizationId: session.organizationId,
          year: parsed.data.year,
        },
      },
    });
    if (existing) {
      return { success: false, error: "Bu yil uchun kalendar allaqachon mavjud" };
    }

    const calendar = await prisma.workCalendar.create({
      data: {
        organizationId: session.organizationId,
        year: parsed.data.year,
        name: calendarName(parsed.data.year),
        createdBy: session.userId,
      },
    });

    revalidatePath("/calendar");
    return { success: true, data: { id: calendar.id, year: calendar.year } };
  } catch (err) {
    console.error("[createWorkCalendar]", err);
    return { success: false, error: "Kalendarni yaratib bo'lmadi" };
  }
}

export async function setCalendarDay(
  input: SetCalendarDayInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "calendar:manage");
    if (denied) return denied;

    const parsed = SetCalendarDaySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { calendarId, date, type, title, shortenedBy } = parsed.data;

    const calendar = await prisma.workCalendar.findFirst({
      where: { id: calendarId, organizationId: session.organizationId },
    });
    if (!calendar) return { success: false, error: "Kalendar topilmadi" };
    if (calendar.isConfirmed) {
      return {
        success: false,
        error: "Kalendar tasdiqlangan — o'zgartirish uchun avval qayta oching",
      };
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (type === null) {
      await prisma.workCalendarDay.deleteMany({
        where: { calendarId, date: parsedDate },
      });
    } else {
      await prisma.workCalendarDay.upsert({
        where: { calendarId_date: { calendarId, date: parsedDate } },
        create: {
          calendarId,
          date: parsedDate,
          dayType: type,
          title: title || null,
          shortenedBy: type === "SHORT" ? shortenedBy ?? 1 : null,
        },
        update: {
          dayType: type,
          title: title || null,
          shortenedBy: type === "SHORT" ? shortenedBy ?? 1 : null,
        },
      });
    }

    revalidatePath("/calendar");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[setCalendarDay]", err);
    return { success: false, error: "Kunni saqlab bo'lmadi" };
  }
}

export async function confirmWorkCalendar(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "calendar:manage");
    if (denied) return denied;

    const calendar = await prisma.workCalendar.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!calendar) return { success: false, error: "Kalendar topilmadi" };

    await prisma.workCalendar.update({
      where: { id },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
        name: calendarName(calendar.year),
      },
    });

    revalidatePath("/calendar");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[confirmWorkCalendar]", err);
    return { success: false, error: "Kalendarni tasdiqlab bo'lmadi" };
  }
}

export async function reopenWorkCalendar(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "calendar:manage");
    if (denied) return denied;

    const calendar = await prisma.workCalendar.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!calendar) return { success: false, error: "Kalendar topilmadi" };

    await prisma.workCalendar.update({
      where: { id },
      data: { isConfirmed: false, confirmedAt: null },
    });

    revalidatePath("/calendar");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[reopenWorkCalendar]", err);
    return { success: false, error: "Kalendarni qayta ochib bo'lmadi" };
  }
}
