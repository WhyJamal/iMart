"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { IWorkCalendarSummary } from "@/types/calendar.types";
import { PAGES } from "@/config/pages.config";

import { useCreateWorkCalendar } from "../_hooks/use-calendar-mutations";

interface Props {
  calendars: IWorkCalendarSummary[];
  selectedYear: number;
  canManage: boolean;
}

export function CalendarYearBar({
  calendars,
  selectedYear,
  canManage,
}: Props) {
  const router = useRouter();
  const t = useTranslations("calendar.yearBar");

  const [open, setOpen] = useState(false);

  const nextYear =
    (calendars[0]?.year ??
      new Date().getFullYear() - 1) + 1;

  const [year, setYear] = useState(String(nextYear));

  const { mutate, isPending } =
    useCreateWorkCalendar((createdYear) => {
      setOpen(false);
      router.push(
        `${PAGES.CALENDAR}?year=${createdYear}`
      );
    });

  const handleYearChange = (value: string) => {
    router.push(`${PAGES.CALENDAR}?year=${value}`);
  };

  const handleCreate = () => {
    mutate({ year: Number(year) });
  };

  return (
    <div className="flex items-center gap-2">
      {calendars.length > 0 && (
        <Select
          value={String(selectedYear)}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {calendars.map((c) => (
              <SelectItem
                key={c.year}
                value={String(c.year)}
              >
                {c.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {canManage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              {t("newYear")}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {t("newYear")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>{t("year")}</Label>

                <Input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setYear(e.target.value)
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>

              <Button
                onClick={handleCreate}
                disabled={isPending || !year}
              >
                {isPending
                  ? t("saving")
                  : t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}