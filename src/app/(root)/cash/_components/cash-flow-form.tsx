"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

import { createCashFlow } from "@/actions/cash-actions";
import type { CashDocType, CashDirection, CashMethod } from "@/types/cash.types";

interface Props {
  onClose?: () => void;
}

const DOC_TYPE_OPTIONS: {
  value: Exclude<
    CashDocType,
    "SALE" | "PURCHASE" | "SALE_RETURN" | "PURCHASE_RETURN" | "PAYROLL"
  >;
  label: string;
  direction: CashDirection | null; // null => foydalanuvchi tanlaydi
}[] = [
  { value: "DEPOSIT", label: "Kirim (pul qo'yish)", direction: "IN" },
  { value: "WITHDRAWAL", label: "Chiqim (pul olish)", direction: "OUT" },
  { value: "EXPENSE", label: "Xarajat", direction: "OUT" },
  {
    value: "ADJUSTMENT",
    label: "Tuzatish / Boshlang'ich balans",
    direction: null,
  },
];

export function CashFlowForm({ onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [docType, setDocType] = useState<
    Exclude<CashDocType, "SALE" | "PURCHASE" | "SALE_RETURN" | "PURCHASE_RETURN" | "PAYROLL">
  >("DEPOSIT");
  const [direction, setDirection] = useState<CashDirection>("IN");
  const [method, setMethod] = useState<CashMethod>("CASH");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  const selected = DOC_TYPE_OPTIONS.find((o) => o.value === docType)!;
  const effectiveDirection = selected.direction ?? direction;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/cash");
    }
  };

  const handleDocTypeChange = (value: string) => {
    const opt = DOC_TYPE_OPTIONS.find((o) => o.value === value)!;
    setDocType(opt.value);
    if (opt.direction) setDirection(opt.direction);
  };

  const handleSubmit = () => {
    if (!amount || amount <= 0) {
      toast.error("Summani kiriting");
      return;
    }

    startTransition(async () => {
      const result = await createCashFlow({
        docType,
        direction: effectiveDirection,
        method,
        amount: Number(amount),
        note: note.trim() || undefined,
      });

      if (result.success) {
        toast.success("Saqlandi");
        router.refresh();
        onClose?.();
        if (!onClose) router.push("/cash");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold">Yangi kassa harakati</h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Turi</Label>
          <Select value={docType} onValueChange={handleDocTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {docType === "ADJUSTMENT" && (
            <p className="text-xs text-muted-foreground">
              Kassani birinchi marta ishga tushirayotgan bo'lsangiz, shu yerda
              "Kirim" tanlab boshlang'ich balansni kiriting.
            </p>
          )}
        </div>

        {selected.direction === null && (
          <div className="space-y-1.5">
            <Label>Yo'nalish</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as CashDirection)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Kirim (+)</SelectItem>
                <SelectItem value="OUT">Chiqim (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Summa</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Usul</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as CashMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Naqd</SelectItem>
                <SelectItem value="CARD">Karta</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Izoh (ixtiyoriy)</Label>
          <Input
            placeholder="masalan: Boshlang'ich balans"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Separator />

        {method !== "CASH" && (
          <p className="text-xs text-muted-foreground">
            Karta/QR harakatlar naqd kassaga emas, bank hisobi balansiga
            ta'sir qiladi.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Bekor qilish
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Saqlanmoqda…" : "Saqlash"}
        </Button>
      </div>
    </div>
  );
}