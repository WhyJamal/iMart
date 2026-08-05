"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IWorkCalendarDetail, IResolvedDay } from "@/types/calendar.types";
import {
  countCalendarDays,
  groupByMonth,
  MONTH_NAMES_UZ,
  resolveYearDays,
} from "@/utils/calendar.util";
import { CalendarMonth } from "./calendar-month";
import { CalendarDayDialog } from "./calendar-day-dialog";
import { CalendarLegend } from "./calendar-legend";
import {
  useConfirmWorkCalendar,
  useReopenWorkCalendar,
} from "../_hooks/use-calendar-mutations";

interface Props {
  calendar: IWorkCalendarDetail;
  canManage: boolean;
}

export function CalendarGrid({ calendar, canManage }: Props) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<IResolvedDay | null>(null);

  const days = useMemo(
    () => resolveYearDays(calendar.year, calendar.exceptions),
    [calendar.year, calendar.exceptions]
  );
  const months = useMemo(() => groupByMonth(days), [days]);
  const counts = useMemo(() => countCalendarDays(days), [days]);

  const canEdit = canManage && !calendar.isConfirmed;

  const { mutate: confirm, isPending: isConfirming } = useConfirmWorkCalendar(() =>
    router.refresh()
  );
  const { mutate: reopen, isPending: isReopening } = useReopenWorkCalendar(() =>
    router.refresh()
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Ish kunlari: {counts.workingDays}</Badge>
          <Badge variant="secondary">Bayramlar: {counts.holidays}</Badge>
          <Badge variant="secondary">Dam olish: {counts.weekends}</Badge>
          {calendar.isConfirmed ? (
            <Badge variant="outline" className="border-green-300 text-green-700">
              Tasdiqlangan
            </Badge>
          ) : (
            <Badge variant="outline">Loyiha (tahrirlash mumkin)</Badge>
          )}
        </div>

        {canManage && (
          <div>
            {calendar.isConfirmed ? (
              <Button variant="outline" onClick={() => reopen(calendar.id)} disabled={isReopening}>
                <LockOpen className="w-4 h-4 mr-1" />
                {isReopening ? "..." : "Qayta ochish"}
              </Button>
            ) : (
              <Button onClick={() => confirm(calendar.id)} disabled={isConfirming}>
                <Lock className="w-4 h-4 mr-1" />
                {isConfirming ? "..." : "Tasdiqlash"}
              </Button>
            )}
          </div>
        )}
      </div>

      <CalendarLegend />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((monthDays, i) => (
          <CalendarMonth
            key={i}
            monthIndex={i}
            monthLabel={MONTH_NAMES_UZ[i]}
            days={monthDays}
            canEdit={canEdit}
            onSelectDay={setSelectedDay}
          />
        ))}
      </div>

      <CalendarDayDialog
        calendarId={calendar.id}
        day={selectedDay}
        onClose={() => {
          setSelectedDay(null);
          router.refresh();
        }}
      />
    </div>
  );
}
