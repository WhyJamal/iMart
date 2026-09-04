import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

import {
  getWorkCalendars,
  getWorkCalendarDetail,
} from "@/actions/calendar-actions";

import { CalendarYearBar } from "./_components/calendar-year-bar";
import { CalendarGrid } from "./_components/calendar-grid";
import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getServerSession();

  if (!session || !hasPermission(session.role, "calendar:manage")) {
    redirect(PAGES.HOME);
  }

  const calendars = await getWorkCalendars();
  const { year: yearParam } = await searchParams;

  const selectedYear = yearParam
    ? Number(yearParam)
    : calendars[0]?.year ?? new Date().getFullYear();

  const detail = await getWorkCalendarDetail(selectedYear);

  const t = await getTranslations("calendar");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("description")}
          </p>
        </div>

        <CalendarYearBar
          calendars={calendars}
          selectedYear={selectedYear}
          canManage={hasPermission(session.role, "calendar:manage")}
        />
      </div>

      {detail ? (
        <CalendarGrid
          calendar={detail}
          canManage={hasPermission(session.role, "calendar:manage")}
        />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {t("notCreated", { year: selectedYear })}
          </p>
        </div>
      )}
    </div>
  );
}