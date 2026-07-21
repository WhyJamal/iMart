'use client';

import { useEffect, useState } from "react";

type Color = "white" | "black";

interface DateTimeNowProps {
  color?: Color;
}

export function DateTimeNow({ color = "black" }: DateTimeNowProps) {
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setClock(new Date());

    const t = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => clearInterval(t);
  }, []);

  if (!mounted || !clock) {
    return (
      <div className="text-right">
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        <div className="h-3 w-20 bg-muted animate-pulse rounded mt-1" />
      </div>
    );
  }

  const timeStr = clock.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateStr = clock.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const textColor = color === "white" ? "text-white" : "text-gray-800";
  const subColor = color === "white" ? "text-gray-200" : "text-gray-400";

  return (
    <div className="text-right">
      <p className={`text-[13px] font-bold tracking-tight ${textColor}`}>
        {timeStr}
      </p>
      <p className={`text-[10px] ${subColor}`}>
        {dateStr}
      </p>
    </div>
  );
}