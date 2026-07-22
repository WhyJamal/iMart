"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import type { IOrgUser } from "@/types/user.types";
import type { ICurrentSalary } from "@/types/salary.types";
import { getCurrentSalary } from "@/actions/salary-actions";
import { useCreatePayrollPayment } from "../_hooks/use-payroll-mutations";

interface Props {
  users: IOrgUser[];
  onClose?: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function PayrollPaymentForm({ users, onClose }: Props) {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [salary, setSalary] = useState<ICurrentSalary | null>(null);
  const [isLoadingSalary, startLoadSalary] = useTransition();

  const [periodStart, setPeriodStart] = useState(todayStr());
  const [periodEnd, setPeriodEnd] = useState(todayStr());
  const [workedUnits, setWorkedUnits] = useState("");
  const [bonus, setBonus] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [note, setNote] = useState("");

  const { mutate, isPending } = useCreatePayrollPayment(() => {
    router.refresh();
    if (onClose) onClose();
    else router.push("/payroll");
  });

  useEffect(() => {
    if (!userId) {
      setSalary(null);
      return;
    }
    startLoadSalary(() => {
      void (async () => {
        const result = await getCurrentSalary(userId);
        setSalary(result);
        setWorkedUnits("");
      })();
    });
  }, [userId]);

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/payroll");
  };

  const base = salary
    ? salary.salaryType === "FIXED"
      ? salary.rate
      : (Number(workedUnits) || 0) * salary.rate
    : 0;
  const totalAmount = base + (Number(bonus) || 0) - (Number(deduction) || 0);

  const handleSubmit = () => {
    if (!salary) return;
    mutate({
      userId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      workedUnits: salary.salaryType === "FIXED" ? undefined : Number(workedUnits),
      bonus: Number(bonus) || 0,
      deduction: Number(deduction) || 0,
      paymentMethod,
      note: note || undefined,
    });
  };

  const unitsLabel = salary?.salaryType === "DAILY" ? "Ishlagan kunlar" : "Ishlagan soatlar";

  const canSubmit =
    !!salary &&
    !!userId &&
    (salary.salaryType === "FIXED" || (!!workedUnits && Number(workedUnits) >= 0)) &&
    totalAmount >= 0;

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Pay salary
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

        {userId && !isLoadingSalary && !salary && (
          <p className="text-sm text-destructive">
            Bu xodimga hali stavka belgilanmagan — avval "Set salary" orqali
            belgilang.
          </p>
        )}

        {salary && (
          <>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="font-medium">{salary.salaryType}</span> —{" "}
              {salary.rate.toFixed(2)} сум /{" "}
              {salary.salaryType === "FIXED"
                ? "oy"
                : salary.salaryType === "DAILY"
                ? "kun"
                : "soat"}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Period start</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Period end</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            {salary.salaryType !== "FIXED" && (
              <div className="space-y-1.5">
                <Label>{unitsLabel}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={workedUnits}
                  onChange={(e) => setWorkedUnits(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Bonus</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deduction</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={deduction}
                  onChange={(e) => setDeduction(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "cash" | "card")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <Separator />

            <div className="flex justify-end">
              <dl className="space-y-1 text-sm text-right">
                <div className="flex gap-16 justify-between font-semibold text-base">
                  <dt>Total</dt>
                  <dd>{totalAmount.toFixed(2)} сум</dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
          {isPending ? "Processing…" : "Pay"}
        </Button>
      </div>
    </div>
  );
}
