"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Color = "white" | "black";

interface DateTimeNowProps {
  color?: Color;
}

export function DateTimeNow({ color = "black" }: DateTimeNowProps) {
  const locale = useLocale();

  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setClock(now);
    setSelectedDate(now);

    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted || !clock) {
    return (
      <div className="text-right">
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        <div className="h-3 w-20 bg-muted animate-pulse rounded mt-1" />
      </div>
    );
  }

  const timeStr = clock.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateStr = clock.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const textColor = color === "white" ? "text-white" : "text-gray-800";
  const subColor = color === "white" ? "text-gray-200" : "text-gray-400";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="text-right hover:bg-white/20 transition rounded-xl px-3 py-1 flex flex-col items-end cursor-pointer">
          <p className={`text-[13px] font-bold tracking-tight ${textColor}`}>
            {timeStr}
          </p>
          <p className={`text-[10px] ${subColor}`}>{dateStr}</p>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-125 p-0"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Kalendar</SheetTitle>
        </SheetHeader>

        <div className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="w-full"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}