import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

import { getTimesheets } from "@/actions/timesheet-actions";
import { getPointOptions } from "@/actions/point-actions";

import { TimesheetList } from "./_components/timesheet-list";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { TimesheetForm } from "./_components/timesheet-form";

import { PAGES } from "@/config/pages.config";

export const dynamic = "force-dynamic";

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(session.role, "schedules:manage")
  ) {
    redirect(PAGES.HOME);
  }

  const { new: isNew } = await searchParams;

  const [timesheets, points] = await Promise.all([
    getTimesheets(),
    getPointOptions(),
  ]);

  const t = await getTranslations("timesheet");

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t("title")}
            </h1>

            <p className="text-muted-foreground text-sm mt-0.5">
              {t("description")}
            </p>
          </div>

          <Button asChild disabled={points.length === 0}>
            <Link href={`${PAGES.TIMESHEETS}?new=1`}>
              <Plus className="w-4 h-4 mr-1" />
              {t("newTimesheet")}
            </Link>
          </Button>
        </div>

        <TimesheetList
          timesheets={timesheets}
          canManage
        />
      </div>

      <DrawerBackdrop isOpen={isNew === "1"}>
        <TimesheetForm points={points} />
      </DrawerBackdrop>
    </>
  );
}