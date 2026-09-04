"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type {
  IWorkScheduleDetail,
  IScheduleDay,
} from "@/types/work-schedule.types";

import { MONTH_NAMES_UZ } from "@/utils/calendar.util";

import {
  useFillWorkSchedule,
  useSetScheduleDay,
} from "../../_hooks/use-work-schedule-mutations";

interface Props {
  schedule: IWorkScheduleDetail;
  canManage: boolean;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

const isRedKind = (kind: string) =>
  kind === "holiday" || kind === "weekend";

export function ScheduleTable({
  schedule,
  canManage,
}: Props) {
  const t = useTranslations("work-schedules.scheduleTable");

  const router = useRouter();

  const [editingKey, setEditingKey] = useState<string | null>(
    null
  );

  const dayMap = useMemo(() => {
    const map = new Map<string, IScheduleDay>();

    for (const d of schedule.days) {
      map.set(d.date, d);
    }

    return map;
  }, [schedule.days]);

  const { mutate: fill, isPending: isFilling } =
    useFillWorkSchedule(() => router.refresh());

  const { mutate: setDay, isPending: isSaving } =
    useSetScheduleDay(() => {
      router.refresh();
      setEditingKey(null);
    });

  const monthTotals = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      let hours = 0;
      let workDays = 0;

      for (
        let d = 1;
        d <= daysInMonth(schedule.year, m);
        d++
      ) {
        const key = `${schedule.year}-${String(m + 1).padStart(
          2,
          "0"
        )}-${String(d).padStart(2, "0")}`;

        const entry = dayMap.get(key);

        if (entry && entry.hours > 0) {
          hours += entry.hours;
          workDays += 1;
        }
      }

      return { hours, workDays };
    });
  }, [dayMap, schedule.year]);

  return (
    <div className="space-y-4">
      {canManage && (
        <Button
          onClick={() => fill(schedule.id)}
          disabled={isFilling}
        >
          <RefreshCw className="w-4 h-4 mr-1" />

          {isFilling ? t("filling") : t("fill")}
        </Button>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white pb-5">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium border-r min-w-27.5">
                {t("month")}
              </th>

              <th className="px-2 py-2 text-right font-medium border-r min-w-15">
                {t("days")}
              </th>

              <th className="px-2 py-2 text-right font-medium border-r min-w-15">
                {t("hours")}
              </th>

              {Array.from({ length: 31 }, (_, i) => (
                <th
                  key={i}
                  className="px-1.5 py-2 text-center font-medium min-w-8.5"
                >
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {MONTH_NAMES_UZ.map((label, m) => {
              const dim = daysInMonth(schedule.year, m);
              const totals = monthTotals[m];

              return (
                <tr key={m} className="border-t">
                  <td className="sticky left-0 bg-white px-3 py-1.5 font-medium border-r">
                    {label}
                  </td>

                  <td className="px-2 py-1.5 text-right border-r tabular-nums">
                    {totals.workDays}
                  </td>

                  <td className="px-2 py-1.5 text-right border-r tabular-nums">
                    {totals.hours}
                  </td>

                  {Array.from({ length: 31 }, (_, i) => {
                    const dayNum = i + 1;

                    if (dayNum > dim) {
                      return (
                        <td
                          key={i}
                          className="px-1.5 py-1.5 text-center text-muted-foreground"
                        >
                          —
                        </td>
                      );
                    }

                    const dateKey = `${schedule.year}-${String(
                      m + 1
                    ).padStart(2, "0")}-${String(dayNum).padStart(
                      2,
                      "0"
                    )}`;

                    const entry = dayMap.get(dateKey);
                    const key = dateKey;
                    const isEditing = editingKey === key;
                    const red = entry
                      ? isRedKind(entry.dayKind)
                      : false;

                    return (
                      <td
                        key={i}
                        className={`px-0.5 py-0.5 text-center ${
                          red
                            ? "bg-red-50 text-red-600"
                            : ""
                        } ${
                          entry?.isManual
                            ? "font-semibold"
                            : ""
                        }`}
                        onClick={() =>
                          canManage && setEditingKey(key)
                        }
                      >
                        {isEditing ? (
                          <Input
                            autoFocus
                            type="number"
                            min={0}
                            max={24}
                            step={0.5}
                            defaultValue={entry?.hours ?? 0}
                            className="w-14 h-7 text-xs text-center px-1"
                            disabled={isSaving}
                            onBlur={(e) =>
                              setDay({
                                scheduleId: schedule.id,
                                date: key,
                                hours:
                                  Number(e.target.value) || 0,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                e.currentTarget.blur();

                              if (e.key === "Escape")
                                setEditingKey(null);
                            }}
                          />
                        ) : (
                          <span
                            className={
                              canManage
                                ? "cursor-pointer"
                                : ""
                            }
                          >
                            {entry
                              ? entry.hours > 0
                                ? entry.hours
                                : ""
                              : ""}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("note")}
      </p>
    </div>
  );
}