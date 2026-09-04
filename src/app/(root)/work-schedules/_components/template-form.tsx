"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type {
  IWorkScheduleTemplate,
  ITemplateDay,
} from "@/types/work-schedule.types";

import {
  useCreateTemplate,
  useUpdateTemplate,
} from "../_hooks/use-work-schedule-mutations";

function defaultDays(): ITemplateDay[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i + 1,
    startTime: "08:00",
    endTime: "16:00",
    workHours: i < 5 ? 8 : 0,
    breakHours: 1,
  }));
}

interface Props {
  template?: IWorkScheduleTemplate;
  onClose?: () => void;
}

export function TemplateForm({ template, onClose }: Props) {
  const t = useTranslations("work-schedules.templateForm");

  const router = useRouter();

  const [name, setName] = useState(template?.name ?? "");

  const [days, setDays] = useState<ITemplateDay[]>(
    template?.days ?? defaultDays()
  );

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/work-schedules");
  };

  const onDone = () => {
    router.refresh();
    handleClose();
  };

  const { mutate: create, isPending: isCreating } =
    useCreateTemplate(onDone);

  const { mutate: update, isPending: isUpdating } =
    useUpdateTemplate(onDone);

  const isPending = isCreating || isUpdating;

  const updateDay = <K extends keyof ITemplateDay>(
    dayOfWeek: number,
    key: K,
    value: ITemplateDay[K]
  ) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;

        const updated = { ...d, [key]: value };

        if (
          (key === "startTime" || key === "endTime") &&
          updated.startTime &&
          updated.endTime
        ) {
          const [startH, startM] = updated.startTime
            .split(":")
            .map(Number);

          const [endH, endM] = updated.endTime
            .split(":")
            .map(Number);

          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          let totalMinutes = endMinutes - startMinutes;

          if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
          }

          const breakMinutes =
            Number(updated.breakHours || 0) * 60;

          updated.workHours = Math.max(
            0,
            Number(
              ((totalMinutes - breakMinutes) / 60).toFixed(2)
            )
          );
        }

        return updated;
      })
    );
  };

  const handleSubmit = () => {
    const payload = days.map((d) => ({
      ...d,
      startTime: d.startTime ?? undefined,
      endTime: d.endTime ?? undefined,
    }));

    if (template) {
      update({
        id: template.id,
        name,
        days: payload,
      });
    } else {
      create({
        name,
        days: payload,
      });
    }
  };

  const WEEKDAY_LABELS = [
    t("monday"),
    t("tuesday"),
    t("wednesday"),
    t("thursday"),
    t("friday"),
    t("saturday"),
    t("sunday"),
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <CalendarClock className="w-4 h-4" />

          {template ? t("editTitle") : t("newTitle")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>{t("name")}</Label>

          <Input
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>{t("weekday")}</span>
            <span className="text-center">{t("start")}</span>
            <span className="text-center">{t("end")}</span>
            <span className="text-center">{t("hours")}</span>
            <span className="text-center">{t("break")}</span>
          </div>

          {days.map((d) => (
            <div
              key={d.dayOfWeek}
              className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-2 items-center"
            >
              <span className="text-sm">
                {WEEKDAY_LABELS[d.dayOfWeek - 1]}
              </span>

              <Input
                type="time"
                className="text-xs px-1"
                value={d.startTime ?? ""}
                onChange={(e) =>
                  updateDay(
                    d.dayOfWeek,
                    "startTime",
                    e.target.value
                  )
                }
              />

              <Input
                type="time"
                className="text-xs px-1"
                value={d.endTime ?? ""}
                onChange={(e) =>
                  updateDay(
                    d.dayOfWeek,
                    "endTime",
                    e.target.value
                  )
                }
              />

              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={d.workHours}
                onChange={(e) =>
                  updateDay(
                    d.dayOfWeek,
                    "workHours",
                    Number(e.target.value)
                  )
                }
              />

              <Input
                type="number"
                min={0}
                max={8}
                step={0.5}
                value={d.breakHours}
                onChange={(e) =>
                  updateDay(
                    d.dayOfWeek,
                    "breakHours",
                    Number(e.target.value)
                  )
                }
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {t("note")}
        </p>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          {t("cancel")}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isPending || !name.trim()}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}