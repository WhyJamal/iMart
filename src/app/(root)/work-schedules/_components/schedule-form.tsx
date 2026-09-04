"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarRange } from "lucide-react";

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

import type { IWorkScheduleTemplateOption } from "@/types/work-schedule.types";
import type { IWorkCalendarSummary } from "@/types/calendar.types";

import { useCreateWorkSchedule } from "../_hooks/use-work-schedule-mutations";

interface Props {
  templates: IWorkScheduleTemplateOption[];
  calendars: IWorkCalendarSummary[];
  onClose?: () => void;
}

export function ScheduleForm({ templates, calendars, onClose }: Props) {
  const t = useTranslations("work-schedules.scheduleForm");

  const router = useRouter();
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [templateId, setTemplateId] = useState("");
  const [workCalendarId, setWorkCalendarId] = useState("");

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/work-schedules");
  };

  const { mutate, isPending } = useCreateWorkSchedule(() => {
    router.refresh();
    handleClose();
  });

  const handleSubmit = () => {
    mutate({ name, year, templateId, workCalendarId });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <CalendarRange className="w-4 h-4" />
          {t("title")}
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

        <div className="space-y-1.5">
          <Label>{t("year")}</Label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("template")}</Label>

          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectTemplate")} />
            </SelectTrigger>

            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("workCalendar")}</Label>

          <Select
            value={workCalendarId}
            onValueChange={setWorkCalendarId}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectCalendar")} />
            </SelectTrigger>

            <SelectContent>
              {calendars.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {calendars.length === 0 && (
            <p className="text-xs text-destructive">
              {t("calendarRequired")}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          {t("cancel")}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={
            isPending ||
            !name.trim() ||
            !templateId ||
            !workCalendarId
          }
        >
          {isPending ? t("saving") : t("create")}
        </Button>
      </div>
    </div>
  );
}