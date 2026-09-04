"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, RotateCcw } from "lucide-react";
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

import {
  findPurchaseForReturn,
  createPurchaseReturn,
} from "@/actions/purchase-return-actions";
import type { IPurchaseForReturn } from "@/types/purchase-return.types";

interface Props {
  onClose?: () => void;
}

export function PurchaseReturnForm({ onClose }: Props) {
  const t = useTranslations("purchase-return.form");

  const router = useRouter();

  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  const [receiptNumber, setReceiptNumber] = useState("");
  const [purchase, setPurchase] =
    useState<IPurchaseForReturn | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [qtyMap, setQtyMap] =
    useState<Record<string, number>>({});

  const [costMap, setCostMap] =
    useState<Record<string, number>>({});

  const [reason, setReason] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "qr"
  >("cash");

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/purchase-returns");
    }
  };

  const handleSearch = () => {
    if (!receiptNumber.trim()) return;

    startSearch(async () => {
      const result = await findPurchaseForReturn(
        receiptNumber.trim()
      );

      setNotFound(!result);
      setPurchase(result);
      setQtyMap({});

      if (result) {
        const defaults: Record<string, number> = {};

        for (const item of result.items) {
          defaults[item.id] = item.unitCost;
        }

        setCostMap(defaults);
      } else {
        setCostMap({});
      }
    });
  };

  const setQty = (
    purchaseItemId: string,
    value: number,
    max: number
  ) => {
    const clamped = Math.max(0, Math.min(value, max));

    setQtyMap((prev) => ({
      ...prev,
      [purchaseItemId]: clamped,
    }));
  };

  const setCost = (
    purchaseItemId: string,
    value: number
  ) => {
    setCostMap((prev) => ({
      ...prev,
      [purchaseItemId]: Math.max(0, value),
    }));
  };

  const selectedItems = purchase
    ? purchase.items
        .filter((i) => (qtyMap[i.id] ?? 0) > 0)
        .map((i) => ({
          purchaseItemId: i.id,
          qty: qtyMap[i.id],
          unitCost: costMap[i.id] ?? i.unitCost,
        }))
    : [];

  const totalAmount = selectedItems.reduce(
    (sum, i) => sum + i.qty * i.unitCost,
    0
  );

  const handleSubmit = () => {
    if (!purchase) return;

    if (selectedItems.length === 0) {
      toast.error(t("validation.items"));
      return;
    }

    startSubmit(async () => {
      const result = await createPurchaseReturn({
        purchaseId: purchase.id,
        reason: reason || undefined,
        paymentMethod,
        items: selectedItems.map(
          ({ purchaseItemId, qty, unitCost }) => ({
            purchaseItemId,
            qty,
            unitCost,
          })
        ),
      });

      if (result.success) {
        toast.success(
          t("success", {
            number: result.data.returnNumber,
          })
        );

        router.refresh();
        onClose?.();

        if (!onClose) {
          router.push("/purchase-returns");
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          {t("title")}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-1.5">
          <Label>{t("receiptNumber")}</Label>

          <div className="flex gap-2">
            <Input
              placeholder={t("receiptPlaceholder")}
              value={receiptNumber}
              onChange={(e) =>
                setReceiptNumber(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && handleSearch()
              }
            />

            <Button
              type="button"
              variant="outline"
              onClick={handleSearch}
              disabled={
                isSearching || !receiptNumber.trim()
              }
            >
              <Search className="w-4 h-4 mr-1" />
              {isSearching ? t("searching") : t("find")}
            </Button>
          </div>

          {notFound && (
            <p className="text-sm text-destructive">
              {t("purchaseNotFound")}
            </p>
          )}
        </div>

        {purchase && (
          <>
            <Separator />

            {purchase.contragentName && (
              <p className="text-sm text-muted-foreground">
                {t("contragent")}:{" "}
                <span className="font-medium">
                  {purchase.contragentName}
                </span>
              </p>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_70px_90px_90px_100px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>{t("product")}</span>
                <span className="text-right">{t("bought")}</span>
                <span className="text-right">
                  {t("returnable")}
                </span>
                <span className="text-right">
                  {t("returnQty")}
                </span>
                <span className="text-right">
                  {t("returnCost")}
                </span>
              </div>

              {purchase.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_70px_90px_90px_100px] gap-2 items-center"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {item.product.name}
                    </div>

                    <div className="text-xs text-muted-foreground font-mono">
                      {item.product.code}
                    </div>
                  </div>

                  <span className="text-right text-sm">
                    {item.qty}
                  </span>

                  <span className="text-right text-sm">
                    {item.returnableQty}
                  </span>

                  <Input
                    type="number"
                    min={0}
                    max={item.returnableQty}
                    step={0.001}
                    value={qtyMap[item.id] ?? 0}
                    disabled={item.returnableQty === 0}
                    onChange={(e) =>
                      setQty(
                        item.id,
                        Number(e.target.value),
                        item.returnableQty
                      )
                    }
                  />

                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={
                      costMap[item.id] ?? item.unitCost
                    }
                    disabled={item.returnableQty === 0}
                    onChange={(e) =>
                      setCost(
                        item.id,
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              ))}

              {purchase.items.some(
                (i) =>
                  i.returnableQty <
                  i.qty - i.returnedQty
              ) && (
                <p className="text-xs text-muted-foreground">
                  {t("stockWarning")}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("reason")}</Label>

                <Input
                  placeholder={t("reasonPlaceholder")}
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("refundMethod")}</Label>

                <Select
                  value={paymentMethod}
                  onValueChange={(v) =>
                    setPaymentMethod(
                      v as "cash" | "card" | "qr"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="cash">
                      {t("cash")}
                    </SelectItem>

                    <SelectItem value="card">
                      {t("card")}
                    </SelectItem>

                    <SelectItem value="qr">
                      {t("qr")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <dl className="space-y-1 text-sm text-right">
                <div className="flex gap-16 justify-between">
                  <dt className="text-muted-foreground">
                    {t("items")}
                  </dt>

                  <dd>{selectedItems.length}</dd>
                </div>

                <div className="flex gap-16 justify-between font-semibold text-base">
                  <dt>{t("refundAmount")}</dt>

                  <dd>
                    {totalAmount.toFixed(2)}{" "}
                    {t("currency")}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          {t("cancel")}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !purchase ||
            selectedItems.length === 0
          }
        >
          {isSubmitting ? t("processing") : t("create")}
        </Button>
      </div>
    </div>
  );
}