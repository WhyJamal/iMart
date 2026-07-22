"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet2 } from "lucide-react";
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
import type { IOrgUser } from "@/types/user.types";
import { useSetSalaryRate } from "../_hooks/use-salary-mutations";

interface Props {
  users: IOrgUser[];
  onClose?: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function SalaryRateForm({ users, onClose }: Props) {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [salaryType, setSalaryType] = useState<"FIXED" | "DAILY" | "HOURLY">("FIXED");
  const [rate, setRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr());
  const [reason, setReason] = useState("");

  const { mutate, isPending } = useSetSalaryRate(() => {
    router.refresh();
    if (onClose) onClose();
    else router.push("/payroll");
  });

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/payroll");
  };

  const handleSubmit = () => {
    mutate({
      userId,
      salaryType,
      rate: Number(rate),
      effectiveFrom: new Date(effectiveFrom),
      reason: reason || undefined,
    });
  };

  const rateLabel =
    salaryType === "FIXED" ? "Oylik summa" : salaryType === "DAILY" ? "1 kun narxi" : "1 soat narxi";

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Wallet2 className="w-4 h-4" />
          Set salary
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Employee</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Xodimni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Salary type</Label>
          <Select
            value={salaryType}
            onValueChange={(v) => setSalaryType(v as "FIXED" | "DAILY" | "HOURLY")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Oylik (FIXED)</SelectItem>
              <SelectItem value="DAILY">Kunbay (DAILY)</SelectItem>
              <SelectItem value="HOURLY">Soatbay (HOURLY)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{rateLabel}</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Effective from</Label>
          <Input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Reason (optional)</Label>
          <Input
            placeholder="e.g. Yillik oshirish"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !userId || !rate || Number(rate) <= 0}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
