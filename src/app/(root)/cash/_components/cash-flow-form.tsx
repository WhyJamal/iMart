"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { showPointFundsAwareError } from "@/lib/point-funds-error";

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

import type {
  CashDirection,
  CashMethod,
} from "@/types/cash.types";

import type { CreateCashFlowInput } from "@/schema/cash.schema";

import type { IPointOption } from "@/types/point.types";

import { useTranslations } from "next-intl";

// Radix Select bo'sh string qiymatni qabul qilmaydi — "nuqtasiz
// (umumiy)" tanlovi shu sentinel bilan ifodalanadi va yuborishda
// null'ga aylantiriladi.
const NO_POINT = "__none__";

interface Props {
  points: IPointOption[];
  /** Foydalanuvchining o'z nuqtasi — standart tanlov */
  defaultPointId?: string | null;
  /** Saqlangandan/yopilgandan keyin qaytiladigan manzil (filtr bilan) */
  closeHref?: string;
  onClose?: () => void;
}

// Qo'lda kiritiladigan turlar — createCashFlow schema'si bilan bir xil
type ManualDocType = CreateCashFlowInput["docType"];

const DOC_TYPE_OPTIONS: {
  value: ManualDocType;
  label: string;
  direction: CashDirection | null;
}[] = [
  {
    value: "DEPOSIT",
    label: "deposit",
    direction: "IN",
  },
  {
    value: "WITHDRAWAL",
    label: "withdrawal",
    direction: "OUT",
  },
  {
    value: "EXPENSE",
    label: "expense",
    direction: "OUT",
  },
  {
    value: "ADJUSTMENT",
    label: "adjustment",
    direction: null,
  },
];

export function CashFlowForm({
  points,
  defaultPointId,
  closeHref = "/cash",
  onClose,
}: Props) {
  const router = useRouter();

  const t = useTranslations("cash.form");

  const [isPending, startTransition] = useTransition();

  const [docType, setDocType] =
    useState<ManualDocType>("DEPOSIT");

  const [direction, setDirection] =
    useState<CashDirection>("IN");

  const [method, setMethod] =
    useState<CashMethod>("CASH");

  const [pointId, setPointId] = useState<string>(
    defaultPointId ?? NO_POINT
  );

  const [amount, setAmount] = useState<number>(0);

  const [note, setNote] = useState("");

  const selected =
    DOC_TYPE_OPTIONS.find((o) => o.value === docType)!;

  const effectiveDirection =
    selected.direction ?? direction;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push(closeHref);
    }
  };

  const handleDocTypeChange = (value: string) => {
    const opt =
      DOC_TYPE_OPTIONS.find((o) => o.value === value)!;

    setDocType(opt.value);

    if (opt.direction) {
      setDirection(opt.direction);
    }
  };

  const handleSubmit = () => {
    if (!amount || amount <= 0) {
      toast.error(t("amountRequired"));
      return;
    }

    startTransition(async () => {
      const result = await createCashFlow({
        docType,
        direction: effectiveDirection,
        method,
        amount: Number(amount),
        note: note.trim() || undefined,
        pointId: pointId === NO_POINT ? null : pointId,
      });

      if (result.success) {
        toast.success(t("saved"));

        router.refresh();

        onClose?.();

        if (!onClose) router.push(closeHref);
      } else {
        showPointFundsAwareError(result.error, router);
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {t("title")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>{t("type")}</Label>

          <Select
            value={docType}
            onValueChange={handleDocTypeChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {DOC_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t(o.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {docType === "ADJUSTMENT" && (
            <p className="text-xs text-muted-foreground">
              {t("adjustmentDescription")}
            </p>
          )}
        </div>

        {selected.direction === null && (
          <div className="space-y-1.5">
            <Label>{t("direction")}</Label>

            <Select
              value={direction}
              onValueChange={(v) =>
                setDirection(v as CashDirection)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="IN">
                  {t("income")}
                </SelectItem>

                <SelectItem value="OUT">
                  {t("outcome")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>{t("point")}</Label>

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

              <SelectItem value={NO_POINT}>
                {t("noPoint")}
              </SelectItem>
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            {t("pointDescription")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("amount")}</Label>

            <Input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) =>
                setAmount(Number(e.target.value))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("method")}</Label>

            <Select
              value={method}
              onValueChange={(v) =>
                setMethod(v as CashMethod)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="CASH">
                  {t("cash")}
                </SelectItem>

                <SelectItem value="CARD">
                  {t("card")}
                </SelectItem>

                <SelectItem value="QR">
                  {t("qr")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("note")}</Label>

          <Input
            placeholder={t("notePlaceholder")}
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
          />
        </div>

        <Separator />

        {method !== "CASH" && (
          <p className="text-xs text-muted-foreground">
            {t("bankDescription")}
          </p>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          {t("cancel")}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending
            ? t("saving")
            : t("save")}
        </Button>
      </div>
    </div>
  );
}