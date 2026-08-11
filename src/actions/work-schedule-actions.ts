"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  CreateWorkScheduleSchema,
  SetScheduleDaySchema,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type CreateWorkScheduleInput,
  type SetScheduleDayInput,
} from "@/schema/work-schedule.schema";
import type { ActionResult } from "@/types/action-result.types";
import type { TxClient } from "@/types/prisma.types";
import type {
  IWorkScheduleTemplate,
  IWorkScheduleTemplateOption,
  IWorkScheduleSummary,
  IWorkScheduleDetail,
  IWorkScheduleOption,
} from "@/types/work-schedule.types";
import type { ICalendarDayException } from "@/types/calendar.types";
import { resolveYearDays } from "@/utils/calendar.util";

// ─── Templates (Шаблоны расписания) ────────────────────────────────────────────

export async function getWorkScheduleTemplates(): Promise<IWorkScheduleTemplate[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const templates = await prisma.workScheduleTemplate.findMany({
    where: { organizationId: session.organizationId },
    include: {
      days: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { schedules: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return templates.map((t: (typeof templates)[number]) => ({
    id: t.id,
    name: t.name,
    scheduleCount: t._count.schedules,
    createdAt: t.createdAt,
    days: t.days.map((d: (typeof t.days)[number]) => ({
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      workHours: Number(d.workHours),
      breakHours: Number(d.breakHours),
    })),
  }));
}

export async function getWorkScheduleTemplateOptions(): Promise<
  IWorkScheduleTemplateOption[]
> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.workScheduleTemplate.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createTemplate(
  input: CreateTemplateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const parsed = CreateTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const template = await prisma.workScheduleTemplate.create({
      data: {
        organizationId: session.organizationId,
        name: parsed.data.name,
        days: {
          create: parsed.data.days.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            startTime: d.startTime ?? null,
            endTime: d.endTime ?? null,
            workHours: d.workHours,
            breakHours: d.breakHours,
          })),
        },
      },
    });

    revalidatePath("/work-schedules");
    return { success: true, data: { id: template.id } };
  } catch (err) {
    console.error("[createTemplate]", err);
    return { success: false, error: "Shablonni yaratib bo'lmadi" };
  }
}

export async function updateTemplate(
  input: UpdateTemplateInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const parsed = UpdateTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { id, name, days } = parsed.data;

    const existing = await prisma.workScheduleTemplate.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Shablon topilmadi" };

    await prisma.$transaction(async (tx: TxClient) => {
      await tx.workScheduleTemplate.update({ where: { id }, data: { name } });
      await tx.workScheduleTemplateDay.deleteMany({ where: { templateId: id } });
      await tx.workScheduleTemplateDay.createMany({
        data: days.map((d) => ({
          templateId: id,
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime ?? null,
          endTime: d.endTime ?? null,
          workHours: d.workHours,
          breakHours: d.breakHours,
        })),
      });
    });

    revalidatePath("/work-schedules");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateTemplate]", err);
    return { success: false, error: "Shablonni yangilab bo'lmadi" };
  }
}

export async function deleteTemplate(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const existing = await prisma.workScheduleTemplate.findFirst({
      where: { id, organizationId: session.organizationId },
      include: { _count: { select: { schedules: true } } },
    });
    if (!existing) return { success: false, error: "Shablon topilmadi" };
    if (existing._count.schedules > 0) {
      return {
        success: false,
        error: "Bu shablon asosida grafiklar bor, avval ularni o'chiring",
      };
    }

    await prisma.workScheduleTemplate.delete({ where: { id } });

    revalidatePath("/work-schedules");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteTemplate]", err);
    return { success: false, error: "Shablonni o'chirib bo'lmadi" };
  }
}

// ─── WorkSchedule (yillik konkret grafik) ──────────────────────────────────────

export async function getWorkSchedules(): Promise<IWorkScheduleSummary[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const schedules = await prisma.workSchedule.findMany({
    where: { organizationId: session.organizationId },
    include: {
      template: { select: { name: true } },
      _count: { select: { users: true, days: true } },
    },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  return schedules.map((s: (typeof schedules)[number]) => ({
    id: s.id,
    name: s.name,
    year: s.year,
    templateId: s.templateId,
    templateName: s.template.name,
    userCount: s._count.users,
    filledDaysCount: s._count.days,
    createdAt: s.createdAt,
  }));
}

export async function getWorkScheduleOptions(): Promise<IWorkScheduleOption[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.workSchedule.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, name: true, year: true },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });
}

export async function getWorkScheduleDetail(
  id: string
): Promise<IWorkScheduleDetail | null> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const schedule = await prisma.workSchedule.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { days: { orderBy: { date: "asc" } } },
  });
  if (!schedule) return null;

  return {
    id: schedule.id,
    name: schedule.name,
    year: schedule.year,
    templateId: schedule.templateId,
    workCalendarId: schedule.workCalendarId,
    days: schedule.days.map((d: (typeof schedule.days)[number]) => ({
      date: d.date.toISOString().slice(0, 10),
      hours: Number(d.hours),
      dayKind: d.dayKind,
      isManual: d.isManual,
    })),
  };
}

export async function createWorkSchedule(
  input: CreateWorkScheduleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const parsed = CreateWorkScheduleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { name, year, templateId, workCalendarId } = parsed.data;

    const template = await prisma.workScheduleTemplate.findFirst({
      where: { id: templateId, organizationId: session.organizationId },
    });
    if (!template) return { success: false, error: "Shablon topilmadi" };

    const workCalendar = await prisma.workCalendar.findFirst({
      where: { id: workCalendarId, organizationId: session.organizationId },
    });
    if (!workCalendar) return { success: false, error: "Ish kalendari topilmadi" };

    const schedule = await prisma.workSchedule.create({
      data: {
        organizationId: session.organizationId,
        name,
        year,
        templateId,
        workCalendarId,
      },
    });

    revalidatePath("/work-schedules");
    return { success: true, data: { id: schedule.id } };
  } catch (err) {
    console.error("[createWorkSchedule]", err);
    return { success: false, error: "Grafikni yaratib bo'lmadi" };
  }
}

export async function deleteWorkSchedule(
  id: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const existing = await prisma.workSchedule.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!existing) return { success: false, error: "Grafik topilmadi" };

    await prisma.workSchedule.delete({ where: { id } });

    revalidatePath("/work-schedules");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteWorkSchedule]", err);
    return { success: false, error: "Grafikni o'chirib bo'lmadi" };
  }
}

/**
 * fillWorkSchedule — 1C'dagi "Заполнить" tugmasi. Shablon (hafta kuni
 * bo'yicha soat) + WorkCalendar (bayram/dam qoidasi, sizning
 * resolveYearDays() helperingiz) kesishmasidan yilning HAR BIR kuni
 * uchun soatni hisoblab, WorkScheduleDay'larni yozadi.
 *
 * Qo'lda tuzatilgan kunlar (isManual: true) — QAYTA YOZILMAYDI,
 * 1C'dagidek foydalanuvchi tuzatgan qiymat saqlanib qoladi.
 */
export async function fillWorkSchedule(
  scheduleId: string
): Promise<ActionResult<{ filledCount: number }>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const schedule = await prisma.workSchedule.findFirst({
      where: { id: scheduleId, organizationId: session.organizationId },
      include: { template: { include: { days: true } } },
    });
    if (!schedule) return { success: false, error: "Grafik topilmadi" };
    if (!schedule.workCalendarId) {
      return { success: false, error: "Grafikka ish kalendari biriktirilmagan" };
    }

    const calendarDays = await prisma.workCalendarDay.findMany({
      where: { calendarId: schedule.workCalendarId },
    });
    const exceptions: ICalendarDayException[] = calendarDays.map(
      (d: (typeof calendarDays)[number]) => ({
        date: d.date.toISOString().slice(0, 10),
        type: d.dayType as ICalendarDayException["type"],
        title: d.title,
        shortenedBy: d.shortenedBy != null ? Number(d.shortenedBy) : null,
      })
    );

    const resolvedDays = resolveYearDays(schedule.year, exceptions);

    // dayOfWeek: 1=Dushanba...7=Yakshanba bo'yicha shablon soatlari
    const hoursByWeekday = new Map<number, number>();
    for (const d of schedule.template.days) {
      hoursByWeekday.set(d.dayOfWeek, Number(d.workHours));
    }

    // Qo'lda tuzatilgan kunlarni bilib olamiz — ularga tegmaymiz
    const manualDays = await prisma.workScheduleDay.findMany({
      where: { scheduleId, isManual: true },
      select: { date: true },
    });
    const manualDates = new Set(
      manualDays.map((d: (typeof manualDays)[number]) => d.date.toISOString().slice(0, 10))
    );

    const rowsToUpsert = resolvedDays
      .filter((rd) => !manualDates.has(rd.date))
      .map((rd) => {
        const jsDate = new Date(rd.date + "T00:00:00.000Z");
        const isoWeekday = jsDate.getUTCDay() === 0 ? 7 : jsDate.getUTCDay(); // 1=Dush..7=Yaksh
        const templateHours = hoursByWeekday.get(isoWeekday) ?? 0;

        let hours = 0;
        if (rd.kind === "workday" || rd.kind === "moved-workday") {
          hours = templateHours;
        } else if (rd.kind === "short") {
          hours = Math.max(0, templateHours - (rd.shortenedBy ?? 0));
        } // holiday | weekend -> 0

        return { date: rd.date, hours, dayKind: rd.kind };
      });

    await prisma.$transaction(async (tx: TxClient) => {
      for (const row of rowsToUpsert) {
        await tx.workScheduleDay.upsert({
          where: {
            scheduleId_date: {
              scheduleId,
              date: new Date(row.date + "T00:00:00.000Z"),
            },
          },
          create: {
            scheduleId,
            date: new Date(row.date + "T00:00:00.000Z"),
            hours: row.hours,
            dayKind: row.dayKind,
            isManual: false,
          },
          update: {
            hours: row.hours,
            dayKind: row.dayKind,
          },
        });
      }
    });

    revalidatePath("/work-schedules");
    return { success: true, data: { filledCount: rowsToUpsert.length } };
  } catch (err) {
    console.error("[fillWorkSchedule]", err);
    return { success: false, error: "Grafikni to'ldirib bo'lmadi" };
  }
}

/**
 * Bitta kunni qo'lda tuzatish (masalan xodim kelmagan). Shundan
 * keyin bu kun keyingi "Заполнить"da qayta yozilmaydi.
 */
export async function setScheduleDay(
  input: SetScheduleDayInput
): Promise<ActionResult<undefined>> {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const denied = checkPermission(session.role, "schedules:manage");
    if (denied) return denied;

    const parsed = SetScheduleDaySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const { scheduleId, date, hours } = parsed.data;

    const schedule = await prisma.workSchedule.findFirst({
      where: { id: scheduleId, organizationId: session.organizationId },
    });
    if (!schedule) return { success: false, error: "Grafik topilmadi" };

    const existing = await prisma.workScheduleDay.findUnique({
      where: {
        scheduleId_date: { scheduleId, date: new Date(date + "T00:00:00.000Z") },
      },
    });

    await prisma.workScheduleDay.upsert({
      where: {
        scheduleId_date: { scheduleId, date: new Date(date + "T00:00:00.000Z") },
      },
      create: {
        scheduleId,
        date: new Date(date + "T00:00:00.000Z"),
        hours,
        dayKind: existing?.dayKind ?? "workday",
        isManual: true,
      },
      update: {
        hours,
        isManual: true,
      },
    });

    revalidatePath("/work-schedules");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[setScheduleDay]", err);
    return { success: false, error: "Kunni saqlab bo'lmadi" };
  }
}
