import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getWorkScheduleDetail } from "@/actions/work-schedule-actions";
import { ScheduleTable } from "./_components/schedule-table";
import { PAGES } from "@/config/pages.config";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session || !hasPermission(session.role, "schedules:manage")) {
    redirect(PAGES.HOME);
  }

  const { id } = await params;
  const schedule = await getWorkScheduleDetail(id);
  if (!schedule) notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={PAGES.WORK_SCHEDULES}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{schedule.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {schedule.year}
          </p>
        </div>
      </div>

      <ScheduleTable schedule={schedule} canManage />
    </div>
  );
}
