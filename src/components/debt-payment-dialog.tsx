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

interface Props {
  name: string;
  debt: number;
  onSubmit: (input: {
    amount: number;
    method: "CASH" | "CARD" | "QR";
    note?: string;
  }) => Promise<ActionResult<unknown>>;
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
  };
}

export function DebtPaymentDialog({ name, debt, onSubmit, labels }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState(String(debt));
  const [method, setMethod] = useState<"CASH" | "CARD" | "QR">("CASH");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;

    startTransition(async () => {
      const result = await onSubmit({
        amount: value,
        method,
        note: note.trim() || undefined,
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
