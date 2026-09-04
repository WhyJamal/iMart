"use client";

import { useTranslations } from "next-intl";

const ITEMS = [
  { swatch: "bg-white border border-border", key: "workday" },
  { swatch: "bg-muted", key: "weekend" },
  { swatch: "bg-destructive/15", key: "holiday" },
  { swatch: "bg-amber-100", key: "short" },
  { swatch: "bg-blue-100", key: "movedWorkday" },
] as const;

export function CalendarLegend() {
  const t = useTranslations("calendar.legend");

  return (
    <div className="flex flex-wrap gap-4">
      {ITEMS.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className={`w-3 h-3 rounded ${item.swatch}`}
          />
          {t(item.key)}
        </div>
      ))}
    </div>
  );
}