"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Undo2 } from "lucide-react";
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

import { findSaleForReturn, createSaleReturn } from "@/actions/return-actions";
import type { ISaleForReturn } from "@/types/return.types";

interface Props {
  onClose?: () => void;
}

export function ReturnForm({ onClose }: Props) {
  const router = useRouter();
  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  const [saleNumber, setSaleNumber] = useState("");
  const [sale, setSale] = useState<ISaleForReturn | null>(null);
  const [notFound, setNotFound] = useState(false);

  // saleItemId -> qty to return
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">(
    "cash"
  );

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/returns");
    }
  };

  const handleSearch = () => {
    if (!saleNumber.trim()) return;

    startSearch(async () => {
      const result = await findSaleForReturn(saleNumber.trim());
      setNotFound(!result);
      setSale(result);
      setQtyMap({});
    });
  };

  const setQty = (saleItemId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(value, max));
    setQtyMap((prev) => ({ ...prev, [saleItemId]: clamped }));
  };

  const selectedItems = sale
    ? sale.items
        .filter((i) => (qtyMap[i.id] ?? 0) > 0)
        .map((i) => ({
          saleItemId: i.id,
          qty: qtyMap[i.id],
          unitPrice: i.unitPrice,
        }))
    : [];

  const totalAmount = selectedItems.reduce(
    (sum, i) => sum + i.qty * i.unitPrice,
    0
  );

  const handleSubmit = () => {
    if (!sale) return;

    if (selectedItems.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }

    startSubmit(async () => {
      const result = await createSaleReturn({
        saleId: sale.id,
        reason: reason || undefined,
        paymentMethod,
        items: selectedItems.map(({ saleItemId, qty }) => ({
          saleItemId,
          qty,
        })),
      });

      if (result.success) {
        toast.success(`Return ${result.data.returnNumber} created`);
        router.refresh();
        onClose?.();
        if (!onClose) router.push("/returns");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Undo2 className="w-4 h-4" />
          New Return
        </h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Sale search */}
        <div className="space-y-1.5">
          <Label>Sale # (chek raqami)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. SALE-XXXXX-XXXX"
              value={saleNumber}
              onChange={(e) => setSaleNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSearch}
              disabled={isSearching || !saleNumber.trim()}
            >
              <Search className="w-4 h-4 mr-1" />
              {isSearching ? "Searching…" : "Find"}
            </Button>
          </div>
          {notFound && (
            <p className="text-sm text-destructive">Sale not found</p>
          )}
        </div>

        {sale && (
          <>
            <Separator />

            {/* Items */}
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_90px_100px_100px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Product</span>
                <span className="text-right">Sold</span>
                <span className="text-right">Returnable</span>
                <span className="text-right">Return qty</span>
              </div>

              {sale.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_90px_100px_100px] gap-2 items-center"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {item.product.code}
                    </div>
                  </div>
                  <span className="text-right text-sm">{item.qty}</span>
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
                </div>
              ))}
            </div>

            <Separator />

            {/* Reason & payment method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Reason (optional)</Label>
                <Input
                  placeholder="e.g. Defective item"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Refund method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) =>
                    setPaymentMethod(v as "cash" | "card" | "qr")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="qr">QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-end">
              <dl className="space-y-1 text-sm text-right">
                <div className="flex gap-16 justify-between">
                  <dt className="text-muted-foreground">Items</dt>
                  <dd>{selectedItems.length}</dd>
                </div>
                <div className="flex gap-16 justify-between font-semibold text-base">
                  <dt>Refund amount</dt>
                  <dd>{totalAmount.toFixed(2)} сум</dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !sale || selectedItems.length === 0}
        >
          {isSubmitting ? "Processing…" : "Create return"}
        </Button>
      </div>
    </div>
  );
}
