"use client";

import { useEffect, useState, useTransition } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";
import { showPointFundsAwareError } from "@/lib/point-funds-error";

import { ArrowLeftRight } from "lucide-react";

import { useTranslations } from "next-intl";

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

import { createCashTransfer } from "@/actions/cash-actions";

import type { IPointOption } from "@/types/point.types";
import type { CashMethod } from "@/types/cash.types";

// Radix Select bo'sh string qiymatni qabul qilmaydi — "nuqtasiz
// (umumiy)" tanlovi shu sentinel bilan ifodalanadi va yuborishda
// null'ga aylantiriladi.
const NO_POINT = "__none__";

interface Props {
  points: IPointOption[];
  defaultPointId?: string | null;
}

/**
 * Nuqtalar (foyda markazlari) orasida pul o'tkazish. Umumiy kassa/bank
 * balansini o'zgartirmaydi — faqat qaysi nuqta hisobiga tegishli
 * ekanini o'zgartiradi (bitta OUT + bitta IN, netto nol).
 */
export function CashTransferDialog({ points, defaultPointId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations("cash.transfer");

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [fromPointId, setFromPointId] = useState<string>(
    defaultPointId ?? NO_POINT
  );
  const [toPointId, setToPointId] = useState<string>(NO_POINT);
  const [method, setMethod] = useState<CashMethod>("CASH");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");

  // Boshqa sahifadan "mablag' yetarli emas" xabaridagi "O'tkazish"
  // tugmasi bosilganda, /cash?transfer=1&toPoint=&amount= bilan
  // keladi — oynani "Nuqtasiz (umumiy)"dan kerakli nuqtaga, kerakli
  // summa bilan oldindan to'ldirib ochamiz.
  /* eslint-disable react-hooks/set-state-in-effect --
     URL query orqali (boshqa sahifadan) kelayotgan bir martalik
     tashqi signalni oynaga aks ettiramiz; darhol o'zimiz query'ni
     tozalaymiz, shuning uchun keyingi renderlarda qayta ishga
     tushmaydi. */
  useEffect(() => {
    if (searchParams.get("transfer") !== "1") return;

    const toPoint = searchParams.get("toPoint");
    const prefillAmount = Number(searchParams.get("amount"));

    setFromPointId(NO_POINT);
    if (toPoint) setToPointId(toPoint);
    if (prefillAmount > 0) setAmount(prefillAmount);
    setOpen(true);

    const next = new URLSearchParams(searchParams.toString());
    next.delete("transfer");
    next.delete("toPoint");
    next.delete("amount");
    const qs = next.toString();
    router.replace(qs ? `/cash?${qs}` : "/cash");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sameSelection = fromPointId === toPointId;

  const handleSubmit = () => {
    if (!amount || amount <= 0) {
      toast.error(t("amountRequired"));
      return;
    }
    if (sameSelection) {
      toast.error(t("samePointError"));
      return;
    }

    startTransition(async () => {
      const result = await createCashTransfer({
        fromPointId: fromPointId === NO_POINT ? null : fromPointId,
        toPointId: toPointId === NO_POINT ? null : toPointId,
        method,
        amount: Number(amount),
        note: note.trim() || undefined,
      });

      if (result.success) {
        toast.success(t("saved"));
        setOpen(false);
        setAmount(0);
        setNote("");
        router.refresh();
      } else {
        showPointFundsAwareError(result.error, router);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowLeftRight className="w-4 h-4 mr-1.5" />
          {t("trigger")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div className="space-y-1.5">
              <Label>{t("from")}</Label>
              <Select value={fromPointId} onValueChange={setFromPointId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {points.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NO_POINT}>{t("noPoint")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ArrowLeftRight className="hidden sm:block w-4 h-4 text-muted-foreground mb-2.5" />

            <div className="space-y-1.5">
              <Label>{t("to")}</Label>
              <Select value={toPointId} onValueChange={setToPointId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {points.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NO_POINT}>{t("noPoint")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sameSelection && (
            <p className="text-xs text-destructive">{t("samePointError")}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("amount")}</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("method")}</Label>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as CashMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{t("cash")}</SelectItem>
                  <SelectItem value="CARD">{t("card")}</SelectItem>
                  <SelectItem value="QR">{t("qr")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("note")}</Label>
            <Input
              placeholder={t("notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t("hint")}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || sameSelection}
          >
            {isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
