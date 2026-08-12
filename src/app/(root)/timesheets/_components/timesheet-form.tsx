"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const MONTH_LABELS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

interface Props {
  points: IPointOption[];
  onClose?: () => void;
}

export function TimesheetForm({ points, onClose }: Props) {
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
          Yangi tabel
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Point</Label>
          <Select value={pointId} onValueChange={setPointId}>
            <SelectTrigger>
              <SelectValue placeholder="Nuqtani tanlang" />
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
            <Label>Yil</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Oy</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_LABELS.map((label, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending || !pointId}>
          {isPending ? "Saving…" : "Create"}
        </Button>
      </div>
    </div>
  );
}