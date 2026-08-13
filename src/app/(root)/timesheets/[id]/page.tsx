import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getTimesheetDetail } from "@/actions/timesheet-actions";
import { TimesheetTable } from "./_components/timesheet-table";
import { PAGES } from "@/config/pages.config";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const MONTH_LABELS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

export default async function TimesheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session || !hasPermission(session.role, "schedules:manage")) {
    redirect(PAGES.HOME);
  }

  const { id } = await params;
  const timesheet = await getTimesheetDetail(id);
  if (!timesheet) notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={PAGES.PAYROLL}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{timesheet.pointName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {MONTH_LABELS[timesheet.month - 1]} {timesheet.year}
          </p>
        </div>
      </div>

      <TimesheetTable timesheet={timesheet} canManage />
    </div>
  );
}