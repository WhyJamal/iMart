import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

import {
  getWorkScheduleTemplates,
  getWorkSchedules,
} from "@/actions/work-schedule-actions";

import { getWorkCalendars } from "@/actions/calendar-actions";

import { TemplateList } from "./_components/template-list";
import { ScheduleList } from "./_components/schedule-list";

import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { TemplateForm } from "./_components/template-form";
import { ScheduleForm } from "./_components/schedule-form";

import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function WorkSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{
    newTemplate?: string;
    editTemplate?: string;
    newSchedule?: string;
  }>;
}) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(session.role, "schedules:manage")
  ) {
    redirect(PAGES.HOME);
  }

  const { newTemplate, editTemplate, newSchedule } =
    await searchParams;

  const [templates, schedules, calendars] = await Promise.all([
    getWorkScheduleTemplates(),
    getWorkSchedules(),
    getWorkCalendars(),
  ]);

  const editTarget = editTemplate
    ? templates.find((t) => t.id === editTemplate)
    : undefined;

  const t = await getTranslations("work-schedules");

  return (
    <>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">
            {t("title")}
          </h1>

          <p className="text-muted-foreground text-sm mt-0.5">
            {t("description")}
          </p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("templates")}
            </h2>

            <Button variant="outline" size="sm" asChild>
              <Link
                href={`${PAGES.WORK_SCHEDULES}?newTemplate=1`}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("newTemplate")}
              </Link>
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <TemplateList
              templates={templates}
              canManage
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("schedules")}
            </h2>

            <Button
              size="sm"
              asChild
              disabled={templates.length === 0}
            >
              <Link
                href={`${PAGES.WORK_SCHEDULES}?newSchedule=1`}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("newSchedule")}
              </Link>
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <ScheduleList
              schedules={schedules}
              canManage
            />
          </div>
        </section>
      </div>

      <DrawerBackdrop isOpen={newTemplate === "1"}>
        <TemplateForm />
      </DrawerBackdrop>

      <DrawerBackdrop isOpen={!!editTemplate}>
        {editTarget && <TemplateForm template={editTarget} />}
      </DrawerBackdrop>

      <DrawerBackdrop isOpen={newSchedule === "1"}>
        <ScheduleForm
          templates={templates}
          calendars={calendars.filter((c) => c.isConfirmed)}
        />
      </DrawerBackdrop>
    </>
  );
}