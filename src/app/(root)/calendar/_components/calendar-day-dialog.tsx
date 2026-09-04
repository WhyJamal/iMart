"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  IResolvedDay,
  CalendarExceptionType,
} from "@/types/calendar.types";

import { useSetCalendarDay } from "../_hooks/use-calendar-mutations";

type OptionValue = "DEFAULT" | CalendarExceptionType;

interface Props {
  calendarId: string;
  day: IResolvedDay | null;
  onClose: () => void;
}

function toOptionValue(day: IResolvedDay): OptionValue {
  if (day.kind === "holiday") return "HOLIDAY";
  if (day.kind === "short") return "SHORT";
  if (day.kind === "moved-workday") return "WORKDAY";
  return "DEFAULT";
}

export function CalendarDayDialog({
  calendarId,
  day,
  onClose,
}: Props) {
  const t = useTranslations("calendar.dayDialog");

  const [option, setOption] = useState<OptionValue>("DEFAULT");
  const [title, setTitle] = useState("");
  const [shortenedBy, setShortenedBy] = useState("1");

  useEffect(() => {
    if (!day) return;

    setOption(toOptionValue(day));
    setTitle(day.title ?? "");
    setShortenedBy(day.shortenedBy ? String(day.shortenedBy) : "1");
  }, [day]);

  const { mutate, isPending } = useSetCalendarDay(onClose);

  if (!day) return null;

  const handleSave = () => {
    mutate({
      calendarId,
      date: day.date,
      type: option === "DEFAULT" ? null : option,
      title: option === "HOLIDAY" ? title : undefined,
      shortenedBy:
        option === "SHORT" ? Number(shortenedBy) : undefined,
    });
  };

  const OPTION_LABELS: Record<OptionValue, string> = {
    DEFAULT: t("default"),
    HOLIDAY: t("holiday"),
    SHORT: t("short"),
    WORKDAY: t("workday"),
  };

  return (
    <Dialog
      open={!!day}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {new Date(`${day.date}T00:00:00`).toLocaleDateString(
              "ru-RU",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("dayType")}</Label>

            <Select
              value={option}
              onValueChange={(v) =>
                setOption(v as OptionValue)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {(Object.keys(OPTION_LABELS) as OptionValue[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {OPTION_LABELS[key]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {option === "HOLIDAY" && (
            <div className="space-y-1.5">
              <Label>{t("name")}</Label>
              <Input
                placeholder={t("namePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}

          {option === "SHORT" && (
            <div className="space-y-1.5">
              <Label>{t("shortenedBy")}</Label>
              <Input
                type="number"
                min={0}
                max={8}
                step="0.5"
                value={shortenedBy}
                onChange={(e) =>
                  setShortenedBy(e.target.value)
                }
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}