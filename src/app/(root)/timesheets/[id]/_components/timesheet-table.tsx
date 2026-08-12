"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ITimesheetDetail, ITimesheetEntry } from "@/types/timesheet.types";
import {
  useFillTimesheetUsers,
  useFillTimesheetDays,
  useSetTimesheetEntry,
} from "../../_hooks/use-timesheet-mutations";

interface Props {
  timesheet: ITimesheetDetail;
  canManage: boolean;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const isRedKind = (kind: string) => kind === "holiday" || kind === "weekend";

export function TimesheetTable({ timesheet, canManage }: Props) {
  const router = useRouter();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const dim = daysInMonth(timesheet.year, timesheet.month);

  const entryMap = useMemo(() => {
    const map = new Map<string, ITimesheetEntry>();
    for (const e of timesheet.entries) map.set(`${e.userId}:${e.date}`, e);
    return map;
  }, [timesheet.entries]);

  const { mutate: fillUsers, isPending: isFillingUsers } = useFillTimesheetUsers(
    () => router.refresh()
  );
  const { mutate: fillDays, isPending: isFillingDays } = useFillTimesheetDays(
    () => router.refresh()
  );
  const { mutate: setEntry, isPending: isSaving } = useSetTimesheetEntry(() => {
    router.refresh();
    setEditingKey(null);
  });

  const dayTotals = useMemo(() => {
    const totals = new Array(dim).fill(0);
    for (const e of timesheet.entries) {
      const day = Number(e.date.slice(8, 10));
      totals[day - 1] += e.hours;
    }
    return totals;
  }, [timesheet.entries, dim]);

  if (timesheet.users.length === 0) {
    return (
      <div className="space-y-4">
        {canManage && (
          <Button onClick={() => fillUsers(timesheet.id)} disabled={isFillingUsers}>
            <Users className="w-4 h-4 mr-1" />
            {isFillingUsers ? "Qo'shilmoqda…" : "Заполнить сотрудников"}
          </Button>
        )}
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Hali xodimlar qo'shilmagan — "Заполнить сотрудников"ni bosing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fillUsers(timesheet.id)}
            disabled={isFillingUsers}
          >
            <Users className="w-4 h-4 mr-1" />
            {isFillingUsers ? "…" : "Заполнить сотрудников"}
          </Button>
          <Button onClick={() => fillDays(timesheet.id)} disabled={isFillingDays}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {isFillingDays ? "To'ldirilmoqda…" : "Заполнение табеля"}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium border-r min-w-40">
                Xodim
              </th>
              <th className="px-2 py-2 text-left font-medium border-r min-w-27.5">
                Grafik
              </th>
              <th className="px-2 py-2 text-right font-medium border-r min-w-13.75">
                Kun
              </th>
              <th className="px-2 py-2 text-right font-medium border-r min-w-13.75">
                Soat
              </th>
              {Array.from({ length: dim }, (_, i) => (
                <th key={i} className="px-1.5 py-2 text-center font-medium min-w-8.5">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timesheet.users.map((u) => (
              <tr key={u.userId} className="border-t">
                <td className="sticky left-0 bg-white px-3 py-1.5 font-medium border-r">
                  {u.userName}
                </td>
                <td className="px-2 py-1.5 text-xs text-muted-foreground border-r">
                  {u.workScheduleName ?? "—"}
                </td>
                <td className="px-2 py-1.5 text-right border-r tabular-nums">
                  {u.totalDays}
                </td>
                <td className="px-2 py-1.5 text-right border-r tabular-nums">
                  {u.totalHours}
                </td>
                {Array.from({ length: dim }, (_, i) => {
                  const day = i + 1;
                  const date = `${timesheet.year}-${pad(timesheet.month)}-${pad(day)}`;
                  const key = `${u.userId}:${date}`;
                  const entry = entryMap.get(key);
                  const isEditing = editingKey === key;
                  const red = entry ? isRedKind(entry.dayKind) : false;

                  return (
                    <td
                      key={i}
                      className={`px-0.5 py-0.5 text-center ${
                        red ? "bg-red-50 text-red-600" : ""
                      } ${entry?.isManual ? "font-semibold" : ""}`}
                      onClick={() => canManage && setEditingKey(key)}
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
                            setEntry({
                              timesheetId: timesheet.id,
                              userId: u.userId,
                              date,
                              hours: Number(e.target.value) || 0,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") setEditingKey(null);
                          }}
                        />
                      ) : (
                        <span className={canManage ? "cursor-pointer" : ""}>
                          {entry && entry.hours > 0 ? entry.hours : ""}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td className="sticky left-0 bg-muted/30 px-3 py-1.5 border-r" colSpan={4}>
                Jami (kuniga)
              </td>
              {dayTotals.map((total, i) => (
                <td key={i} className="px-1.5 py-1.5 text-center tabular-nums">
                  {total > 0 ? total : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Qizil katak — bayram/dam kuni. Katak ustiga bosib qo'lda tuzatish
        mumkin (masalan xodim kelmagan) — tuzatilgan kunlar keyingi
        "Заполнение табеля"da qayta yozilmaydi.
      </p>
    </div>
  );
}