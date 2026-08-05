"use client";

import { cn } from "@/lib/utils";
import type { IResolvedDay } from "@/types/calendar.types";
import { WEEKDAY_LABELS_UZ } from "@/utils/calendar.util";

const KIND_STYLES: Record<IResolvedDay["kind"], string> = {
  workday: "bg-white text-foreground border-border",
  weekend: "bg-muted text-muted-foreground border-transparent",
  holiday: "bg-destructive/15 text-destructive border-transparent font-semibold",
  short: "bg-amber-100 text-amber-800 border-transparent font-semibold",
  "moved-workday": "bg-blue-100 text-blue-800 border-transparent font-semibold",
};

interface Props {
  monthIndex: number; // 0-11
  monthLabel: string;
  days: IResolvedDay[];
  canEdit: boolean;
  onSelectDay: (day: IResolvedDay) => void;
}

export function CalendarMonth({ monthLabel, days, canEdit, onSelectDay }: Props) {
  // Dush = 0 ... Yaksh = 6 bo'lgan offset
  const firstWeekday = (new Date(`${days[0].date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const leadingBlanks = Array.from({ length: firstWeekday });

  return (
    <div className="rounded-xl border bg-white p-3">
      <h3 className="text-sm font-semibold mb-2 text-center">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS_UZ.map((w) => (
          <div key={w} className="text-[10px] text-center text-muted-foreground font-medium">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((day) => {
          const dayNum = Number(day.date.slice(8, 10));
          return (
            <button
              key={day.date}
              type="button"
              disabled={!canEdit}
              onClick={() => onSelectDay(day)}
              title={day.title ?? undefined}
              className={cn(
                "aspect-square text-[11px] rounded-md border flex items-center justify-center transition-colors",
                KIND_STYLES[day.kind],
                canEdit ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : "cursor-not-allowed"
              )}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
