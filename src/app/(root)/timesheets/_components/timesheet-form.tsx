"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileSpreadsheet } from "lucide-react";

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

import type { IPointOption } from "@/types/point.types";
import { useCreateTimesheet } from "../_hooks/use-timesheet-mutations";

interface Props {
  points: IPointOption[];
  onClose?: () => void;
}

export function TimesheetForm({ points, onClose }: Props) {
  const t = useTranslations("timesheet.form");
  const months = useTranslations("timesheet.months");

  const router = useRouter();
  const now = new Date();

  const [pointId, setPointId] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/timesheets");
  };

  const { mutate, isPending } = useCreateTimesheet(() => {
    router.refresh();
    handleClose();
  });

  const handleSubmit = () => {
    mutate({ pointId, year, month });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          {t("title")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>{t("point")}</Label>

          <Select value={pointId} onValueChange={setPointId}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectPoint")} />
            </SelectTrigger>

            <SelectContent>
              {points.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("year")}</Label>

            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("month")}</Label>

            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {months(String(i))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          {t("cancel")}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isPending || !pointId}
        >
          {isPending ? t("saving") : t("create")}
        </Button>
      </div>
    </div>
  );
}