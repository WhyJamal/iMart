"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { ActionResult } from "@/types/action-result.types";
import type { IPointOption } from "@/types/point.types";

// Radix Select bo'sh string qiymatni qabul qilmaydi — "nuqtasiz
// (umumiy)" tanlovi shu sentinel bilan ifodalanadi va yuborishda
// null'ga aylantiriladi.
const NO_POINT = "__none__";

interface Props {
  name: string;
  debt: number;
  onSubmit: (input: {
    amount: number;
    method: "CASH" | "CARD" | "QR";
    note?: string;
    pointId?: string | null;
  }) => Promise<ActionResult<unknown>>;
  /** Berilsa — to'lov qaysi nuqta hisobiga yozilishini tanlash imkoni qo'shiladi */
  points?: IPointOption[];
  defaultPointId?: string | null;
  labels: {
    trigger: string;
    title: string;
    currentDebt: string;
    amount: string;
    method: string;
    note: string;
    submit: string;
    cancel: string;
    cash: string;
    card: string;
    qr: string;
    success: string;
    point?: string;
    noPoint?: string;
  };
}

export function DebtPaymentDialog({
  name,
  debt,
  onSubmit,
  points,
  defaultPointId,
  labels,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState(String(debt));
  const [method, setMethod] = useState<"CASH" | "CARD" | "QR">("CASH");
  const [note, setNote] = useState("");
  const [pointId, setPointId] = useState<string>(
    defaultPointId ?? NO_POINT
  );

  const handleSubmit = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;

    startTransition(async () => {
      const result = await onSubmit({
        amount: value,
        method,
        note: note.trim() || undefined,
        ...(points ? { pointId: pointId === NO_POINT ? null : pointId } : {}),
      });

      if (result.success) {
        toast.success(labels.success);
        setOpen(false);
        setNote("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setAmount(String(debt));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Wallet className="w-3.5 h-3.5" />
          {labels.trigger}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {name} — {labels.currentDebt}:{" "}
            <span className="font-semibold text-foreground">
              {debt.toLocaleString("uz-UZ")} so'm
            </span>
          </p>

          <div className="space-y-1.5">
            <Label>{labels.amount}</Label>
            <Input
              type="number"
              min={0}
              max={debt}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{labels.method}</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as "CASH" | "CARD" | "QR")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">{labels.cash}</SelectItem>
                <SelectItem value="CARD">{labels.card}</SelectItem>
                <SelectItem value="QR">{labels.qr}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {points && (
            <div className="space-y-1.5">
              <Label>{labels.point}</Label>
              <Select value={pointId} onValueChange={setPointId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {points.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NO_POINT}>{labels.noPoint}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{labels.note}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {labels.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {labels.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
